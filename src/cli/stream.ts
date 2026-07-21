import * as readline from 'node:readline';

import plot, {
  type Coordinates,
  type FormatterHelpers,
  type Point,
  type Settings,
} from 'simple-ascii-chart';

import {
  CLEAR_SCREEN_SEQUENCE,
  DYNAMIC_PLOT_WIDTH_PADDING,
  MIN_DYNAMIC_PLOT_WIDTH,
  TERMINAL_FALLBACK_COLUMNS,
} from './constants';

import type {
  ParsedStreamSample,
  PlotOutputTarget,
  StreamExecutionOptions,
} from './types';

const parseNumber = (value: string): number | undefined => {
  const parsed = Number(value.trim());

  return Number.isFinite(parsed) ? parsed : undefined;
};

const formatElapsedAxisTick = (elapsedMilliseconds: number): string => {
  const elapsedSeconds = Math.max(0, Math.round(elapsedMilliseconds / 1000));
  if (elapsedSeconds < 60) return `+${elapsedSeconds}s`;

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  if (minutes < 60) return `+${minutes}m${seconds}s`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `+${hours}h${remainingMinutes}m`;
};

const parseStreamValues = (
  tokens: string[],
  startIndex: number,
  seriesCount: number,
): number[] | undefined => {
  const values = tokens
    .slice(startIndex)
    .map((token) => parseNumber(token))
    .filter((value): value is number => value !== undefined);

  return values.length === seriesCount ? values : undefined;
};

const parseStreamSample = ({
  line,
  lastAutoX,
  seriesCount,
}: {
  line: string;
  lastAutoX: number;
  seriesCount: number;
}): ParsedStreamSample | { nextAutoX: number } => {
  const trimmed = line.trim();
  if (!trimmed) return { nextAutoX: lastAutoX };

  const tokens = trimmed.split(/[,\s]+/).filter(Boolean);
  const sampleMs = Date.now();

  if (tokens.length === seriesCount) {
    const values = parseStreamValues(tokens, 0, seriesCount);
    if (!values) return { nextAutoX: lastAutoX };

    const x = sampleMs > lastAutoX ? sampleMs : lastAutoX + 1;

    return { x, values, sampleMs, nextAutoX: x };
  }

  if (tokens.length === seriesCount + 1) {
    const x = parseNumber(tokens[0]);
    const values = parseStreamValues(tokens, 1, seriesCount);
    if (x === undefined || !values) return { nextAutoX: lastAutoX };

    return {
      x,
      values,
      sampleMs,
      nextAutoX: Math.max(x, lastAutoX),
    };
  }

  return { nextAutoX: lastAutoX };
};

class StreamRenderer {
  private readonly plotStream: NodeJS.WriteStream;
  private readonly seriesPoints: Point[][];
  private readonly streamOptions: Settings;
  private nextAutoX = Date.now();
  private streamStartX: number | undefined;
  private previousRateSample: Pick<ParsedStreamSample, 'sampleMs' | 'values'> | undefined;
  private lastRenderAt = 0;
  private hasPendingRender = false;
  private renderTimer: NodeJS.Timeout | undefined;
  private isFinished = false;
  private inputStream: readline.Interface | undefined;

  public constructor(private readonly config: StreamExecutionOptions) {
    this.plotStream = config.plotOutput === 'stderr' ? process.stderr : process.stdout;
    this.seriesPoints = Array.from({ length: config.seriesCount }, () => []);
    this.streamOptions = { ...(config.options ?? {}) };

    if (config.seriesCount === 2 && this.streamOptions.color === undefined) {
      this.streamOptions.color = ['ansiCyan', 'ansiYellow'];
    }
    if (!this.streamOptions.formatter) {
      this.streamOptions.formatter = (value: number, helpers: FormatterHelpers) => {
        if (helpers.axis !== 'x') return value;

        return formatElapsedAxisTick(value - (this.streamStartX ?? value));
      };
    }
  }

  public start(): void {
    this.inputStream = readline.createInterface({
      input: process.stdin,
      crlfDelay: Infinity,
      terminal: false,
    });
    process.on('SIGWINCH', this.onResize);
    process.on('SIGINT', this.onSigInt);
    this.inputStream.on('line', this.onLine);
    this.inputStream.on('close', this.finish);
  }

  private readonly onLine = (line: string): void => {
    if (this.config.passthrough) process.stdout.write(`${line}\n`);

    const parsed = parseStreamSample({
      line,
      lastAutoX: this.nextAutoX,
      seriesCount: this.config.seriesCount,
    });
    this.nextAutoX = parsed.nextAutoX;
    if ('x' in parsed) this.addSample(parsed);
  };

  private readonly onResize = (): void => {
    this.scheduleRender(true);
  };

  private readonly onSigInt = (): void => {
    this.inputStream?.close();
    this.finish();
  };

  private readonly finish = (): void => {
    if (this.isFinished) return;
    this.isFinished = true;

    if (this.renderTimer) clearTimeout(this.renderTimer);
    this.renderTimer = undefined;
    process.off('SIGWINCH', this.onResize);
    process.off('SIGINT', this.onSigInt);

    if (this.hasPendingRender || this.seriesPoints[0].length > 0) {
      this.scheduleRender(true);
    }

    this.plotStream.write('\n');
    process.exit(0);
  };

  private addSample(sample: ParsedStreamSample): void {
    this.streamStartX ??= sample.x;
    const values = this.config.rateEnabled ? this.calculateRates(sample) : sample.values;
    if (!values) return;

    for (let index = 0; index < this.config.seriesCount; index += 1) {
      this.seriesPoints[index].push([sample.x, values[index]]);
      if (this.seriesPoints[index].length > this.config.window) {
        this.seriesPoints[index].splice(
          0,
          this.seriesPoints[index].length - this.config.window,
        );
      }
    }

    this.scheduleRender();
  }

  private calculateRates(sample: ParsedStreamSample): number[] | undefined {
    const previous = this.previousRateSample;
    this.previousRateSample = { sampleMs: sample.sampleMs, values: sample.values };
    if (!previous) return undefined;

    const deltaSeconds = (sample.sampleMs - previous.sampleMs) / 1000;
    if (deltaSeconds <= 0) return undefined;

    return sample.values.map((value, index) => (value - previous.values[index]) / deltaSeconds);
  }

  private scheduleRender(force = false): void {
    if (force) {
      if (this.renderTimer) clearTimeout(this.renderTimer);
      this.renderTimer = undefined;
      this.hasPendingRender = false;
      this.render();

      return;
    }

    const elapsed = Date.now() - this.lastRenderAt;
    if (this.config.refreshMs <= 0 || elapsed >= this.config.refreshMs) {
      this.render();

      return;
    }

    this.hasPendingRender = true;
    if (!this.renderTimer) {
      this.renderTimer = setTimeout(() => {
        this.renderTimer = undefined;
        if (this.hasPendingRender) {
          this.hasPendingRender = false;
          this.render();
        }
      }, this.config.refreshMs - elapsed);
    }
  }

  private render(): void {
    if (this.seriesPoints[0].length === 0) return;

    const renderOptions: Settings = { ...this.streamOptions };
    if (this.config.options?.width === undefined) {
      const columns =
        this.plotStream.columns ?? process.stdout.columns ?? TERMINAL_FALLBACK_COLUMNS;
      renderOptions.width = Math.max(
        MIN_DYNAMIC_PLOT_WIDTH,
        columns - DYNAMIC_PLOT_WIDTH_PADDING,
      );
    }

    const coordinates = (
      this.config.seriesCount === 1 ? this.seriesPoints[0] : this.seriesPoints
    ) as Coordinates;
    this.plotStream.write(`${CLEAR_SCREEN_SEQUENCE}${plot(coordinates, renderOptions)}`);
    this.lastRenderAt = Date.now();
  }
}

/**
 * Writes a completed chart to the selected output stream.
 *
 * @param {string} output - Rendered chart.
 * @param {PlotOutputTarget} plotOutput - Destination process stream.
 * @returns {void} Nothing.
 */
export const executeStatic = (output: string, plotOutput: PlotOutputTarget): void => {
  const stream = plotOutput === 'stderr' ? process.stderr : process.stdout;
  stream.write(output);
};

/**
 * Starts streaming input parsing and chart rendering.
 *
 * @param {StreamExecutionOptions} options - Streaming configuration.
 * @returns {void} Nothing.
 */
export const executeStream = (options: StreamExecutionOptions): void => {
  new StreamRenderer(options).start();
};
