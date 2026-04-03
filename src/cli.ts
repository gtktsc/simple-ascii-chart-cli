#!/usr/bin/env node

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as readline from 'node:readline';
import * as yargs from 'yargs';
import plot from 'simple-ascii-chart';
import { Coordinates, FormatterHelpers, MultiLine, Point, Settings } from 'simple-ascii-chart';
import { CliGraphMode, CliSettingsInput, GRAPH_MODES, preparePlotOptions } from './options';

type InputFormat = 'json' | 'csv' | 'tsv' | 'space';
type PlotOutputTarget = 'stdout' | 'stderr';

type CliArguments = CliSettingsInput & {
  input?: string;
  inputFile?: string;
  format?: InputFormat;
  delimiter?: string;
  header?: boolean;
  xCol?: string;
  yCol?: string;
  stream?: boolean;
  window?: number;
  refreshMs?: number;
  rate?: boolean;
  series?: number;
  passthrough?: boolean;
  plotOutput?: PlotOutputTarget;
  verbose?: boolean;
};

type ParsedStreamSample = {
  x: number;
  values: number[];
  sampleMs: number;
  nextAutoX: number;
};

const clearScreen = '\x1b[2J\x1b[H';

class CliError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'CliError';
  }
}

const fail = (message: string, cause?: unknown): never => {
  throw new CliError(message, cause);
};

const parseNumber = (value: string): number | undefined => {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : undefined;
};

const formatElapsedAxisTick = (elapsedMilliseconds: number): string => {
  const elapsedSeconds = Math.max(0, Math.round(elapsedMilliseconds / 1000));

  if (elapsedSeconds < 60) {
    return `+${elapsedSeconds}s`;
  }

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  if (minutes < 60) {
    return `+${minutes}m${seconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `+${hours}h${remainingMinutes}m`;
};

const inferFormatFromFilePath = (inputFile: string): InputFormat => {
  const extension = path.extname(inputFile).toLowerCase();

  if (extension === '.csv') return 'csv';
  if (extension === '.tsv' || extension === '.tab') return 'tsv';
  if (extension === '.space' || extension === '.dat' || extension === '.txt') return 'space';
  return 'json';
};

const inferFormatFromRawInput = (raw: string): InputFormat => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return 'json';
  }

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    return 'json';
  }

  const firstLine = trimmed.split(/\r?\n/, 1)[0];
  if (firstLine.includes('\t')) {
    return 'tsv';
  }

  if (firstLine.includes(',')) {
    return 'csv';
  }

  return 'space';
};

const getInputFormat = ({
  explicit,
  inputFile,
  raw,
}: {
  explicit?: InputFormat;
  inputFile?: string;
  raw: string;
}): InputFormat => {
  if (explicit) {
    return explicit;
  }

  if (inputFile) {
    return inferFormatFromFilePath(inputFile);
  }

  return inferFormatFromRawInput(raw);
};

const isPoint = (value: unknown): value is Point => {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'number' &&
    Number.isFinite(value[0]) &&
    typeof value[1] === 'number' &&
    Number.isFinite(value[1])
  );
};

const parseJsonCoordinates = (raw: string, sourceLabel: string): Coordinates => {
  let parsedUnknown: unknown;

  try {
    parsedUnknown = JSON.parse(raw);
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    return fail(`Invalid ${sourceLabel} JSON: ${details}`);
  }

  if (!Array.isArray(parsedUnknown)) {
    fail(`Invalid ${sourceLabel}: expected an array`);
  }
  const parsed = parsedUnknown as unknown[];

  if (parsed.length === 0) {
    return [] as Point[];
  }

  if (parsed.every((item: unknown) => isPoint(item))) {
    return parsed as Point[];
  }

  if (
    parsed.every(
      (series: unknown) =>
        Array.isArray(series) && (series as unknown[]).every((item: unknown) => isPoint(item)),
    )
  ) {
    return parsed as MultiLine;
  }

  return fail(`Invalid ${sourceLabel}: expected [[x,y], ...] or [[[x,y], ...], ...]`);
};

const splitDelimitedLine = (line: string, format: InputFormat, delimiter?: string): string[] => {
  if (delimiter !== undefined) {
    return line.split(delimiter);
  }

  if (format === 'csv') {
    return line.split(',');
  }

  if (format === 'tsv') {
    return line.split('\t');
  }

  return line.trim().split(/\s+/);
};

const resolveColumnIndex = ({
  column,
  defaultIndex,
  axis,
  headerColumns,
}: {
  column: string | undefined;
  defaultIndex: number;
  axis: 'x' | 'y';
  headerColumns?: string[];
}): number => {
  if (column === undefined) {
    return defaultIndex;
  }

  if (/^\d+$/.test(column)) {
    const index = Number(column) - 1;
    if (index < 0) {
      fail(`--${axis}-col must be a positive 1-based index`);
    }
    return index;
  }

  if (!headerColumns) {
    return fail(`--${axis}-col="${column}" requires --header or a numeric column index`);
  }

  const index = headerColumns.indexOf(column);
  if (index === -1) {
    fail(`--${axis}-col="${column}" was not found in the header row`);
  }

  return index;
};

const parseDelimitedCoordinates = ({
  raw,
  format,
  delimiter,
  header,
  xCol,
  yCol,
  sourceLabel,
}: {
  raw: string;
  format: InputFormat;
  delimiter?: string;
  header?: boolean;
  xCol?: string;
  yCol?: string;
  sourceLabel: string;
}): Coordinates => {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    fail(`No data found in ${sourceLabel}`);
  }

  const rows = lines.map((line) => splitDelimitedLine(line, format, delimiter));
  let startIndex = 0;
  let headerColumns: string[] | undefined;

  if (header) {
    headerColumns = rows[0].map((column) => column.trim());
    startIndex = 1;
  }

  const xIndex = resolveColumnIndex({
    column: xCol,
    defaultIndex: 0,
    axis: 'x',
    headerColumns,
  });

  const yIndex = resolveColumnIndex({
    column: yCol,
    defaultIndex: 1,
    axis: 'y',
    headerColumns,
  });

  const points: Point[] = [];

  for (let index = startIndex; index < rows.length; index += 1) {
    const row = rows[index];
    const x = parseNumber(row[xIndex] ?? '');
    const y = parseNumber(row[yIndex] ?? '');

    if (x !== undefined && y !== undefined) {
      points.push([x, y]);
    }
  }

  if (points.length === 0) {
    fail(`No valid numeric points could be parsed from ${sourceLabel}`);
  }

  return points as Point[];
};

const parseCoordinatesFromRaw = ({
  raw,
  args,
  sourceLabel,
  inputFile,
}: {
  raw: string;
  args: CliArguments;
  sourceLabel: string;
  inputFile?: string;
}): Coordinates => {
  const format = getInputFormat({
    explicit: args.format,
    inputFile,
    raw,
  });

  if (format === 'json') {
    return parseJsonCoordinates(raw, sourceLabel);
  }

  return parseDelimitedCoordinates({
    raw,
    format,
    delimiter: args.delimiter,
    header: args.header,
    xCol: args.xCol,
    yCol: args.yCol,
    sourceLabel,
  });
};

const readStdinText = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    let output = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk: string) => {
      output += chunk;
    });
    process.stdin.on('error', reject);
    process.stdin.on('end', () => resolve(output));
  });
};

const getStaticInput = async (args: CliArguments): Promise<Coordinates> => {
  if (args.input !== undefined) {
    if (!args.input.trim()) {
      fail('`--input` was provided but empty. Pass coordinate data or use --input-file/stdin.');
    }

    return parseCoordinatesFromRaw({
      raw: args.input,
      args,
      sourceLabel: '--input',
    });
  }

  if (args.inputFile) {
    try {
      const content = await fs.readFile(args.inputFile, 'utf8');
      return parseCoordinatesFromRaw({
        raw: content,
        args,
        sourceLabel: `file ${args.inputFile}`,
        inputFile: args.inputFile,
      });
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      fail(`Unable to read --input-file "${args.inputFile}": ${details}`);
    }
  }

  if (!process.stdin.isTTY) {
    const stdinContent = await readStdinText();
    if (!stdinContent.trim()) {
      fail('Stdin is empty. Pipe data or provide --input/--input-file.');
    }

    return parseCoordinatesFromRaw({
      raw: stdinContent,
      args,
      sourceLabel: 'stdin',
    });
  }

  return fail('Missing input. Provide --input, --input-file, or pipe data via stdin.');
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
  if (!trimmed) {
    return { nextAutoX: lastAutoX };
  }

  const tokens = trimmed.split(/[,\s]+/).filter(Boolean);
  const withAutoX = seriesCount;
  const withExplicitX = seriesCount + 1;

  const parseValues = (startIndex: number): number[] | undefined => {
    const values = tokens
      .slice(startIndex)
      .map((token) => parseNumber(token))
      .filter((value): value is number => value !== undefined);

    if (values.length !== seriesCount) {
      return undefined;
    }

    return values;
  };

  const sampleMs = Date.now();

  if (tokens.length === withAutoX) {
    const values = parseValues(0);
    if (!values) {
      return { nextAutoX: lastAutoX };
    }

    const x = sampleMs > lastAutoX ? sampleMs : lastAutoX + 1;
    return {
      x,
      values,
      sampleMs,
      nextAutoX: x,
    };
  }

  if (tokens.length === withExplicitX) {
    const x = parseNumber(tokens[0]);
    const values = parseValues(1);

    if (x === undefined || !values) {
      return { nextAutoX: lastAutoX };
    }

    return {
      x,
      values,
      sampleMs,
      nextAutoX: x > lastAutoX ? x : lastAutoX,
    };
  }

  return { nextAutoX: lastAutoX };
};

const executeStatic = ({
  input,
  options,
  plotOutput,
}: {
  input: Coordinates;
  options?: Settings;
  plotOutput: PlotOutputTarget;
}) => {
  const output = plot(input, options);
  const stream = plotOutput === 'stderr' ? process.stderr : process.stdout;
  stream.write(output);
};

const executeStream = ({
  options,
  plotOutput,
  refreshMs,
  seriesCount,
  rateEnabled,
  window,
  passthrough,
}: {
  options?: Settings;
  plotOutput: PlotOutputTarget;
  refreshMs: number;
  seriesCount: number;
  rateEnabled: boolean;
  window: number;
  passthrough: boolean;
}) => {
  const plotStream = plotOutput === 'stderr' ? process.stderr : process.stdout;
  const seriesPoints: Point[][] = Array.from({ length: seriesCount }, () => []);
  let nextAutoX = Date.now();
  let streamStartX: number | undefined;
  let previousRateSample: { sampleMs: number; values: number[] } | undefined;
  let lastRenderAt = 0;
  let hasPendingRender = false;
  let renderTimer: NodeJS.Timeout | undefined;
  let isFinished = false;

  const streamOptions: Settings = {
    ...(options ?? {}),
  };

  if (seriesCount === 2 && streamOptions.color === undefined) {
    streamOptions.color = ['ansiCyan', 'ansiYellow'];
  }

    if (!streamOptions.formatter) {
      streamOptions.formatter = (value: number, helpers: FormatterHelpers) => {
        if (helpers.axis === 'x') {
          const startX = streamStartX ?? value;
          return formatElapsedAxisTick(value - startX);
      }

      return value;
    };
  }

  const render = () => {
    if (seriesPoints[0].length === 0) {
      return;
    }

    const renderOptions: Settings = {
      ...streamOptions,
    };

    if (options?.width === undefined) {
      const columns = plotStream.columns ?? process.stdout.columns ?? 80;
      renderOptions.width = Math.max(10, columns - 8);
    }

    const coordinates = (seriesCount === 1 ? seriesPoints[0] : seriesPoints) as Coordinates;
    const output = plot(coordinates, renderOptions);
    plotStream.write(`${clearScreen}${output}`);
    lastRenderAt = Date.now();
  };

  const scheduleRender = (force = false) => {
    if (force) {
      if (renderTimer) {
        clearTimeout(renderTimer);
        renderTimer = undefined;
      }
      hasPendingRender = false;
      render();
      return;
    }

    if (refreshMs <= 0) {
      render();
      return;
    }

    const now = Date.now();
    const elapsed = now - lastRenderAt;
    if (elapsed >= refreshMs) {
      render();
      return;
    }

    hasPendingRender = true;

    if (!renderTimer) {
      renderTimer = setTimeout(() => {
        renderTimer = undefined;
        if (hasPendingRender) {
          hasPendingRender = false;
          render();
        }
      }, refreshMs - elapsed);
    }
  };

  const addSample = (sample: ParsedStreamSample) => {
    if (streamStartX === undefined) {
      streamStartX = sample.x;
    }

    let values = sample.values;
    if (rateEnabled) {
      if (!previousRateSample) {
        previousRateSample = {
          sampleMs: sample.sampleMs,
          values: sample.values,
        };
        return;
      }

      const deltaSeconds = (sample.sampleMs - previousRateSample.sampleMs) / 1000;
      const previousValues = previousRateSample.values;
      previousRateSample = {
        sampleMs: sample.sampleMs,
        values: sample.values,
      };

      if (deltaSeconds <= 0) {
        return;
      }

      values = sample.values.map((value, index) => (value - previousValues[index]) / deltaSeconds);
    }

    for (let index = 0; index < seriesCount; index += 1) {
      seriesPoints[index].push([sample.x, values[index]]);
      if (seriesPoints[index].length > window) {
        seriesPoints[index].splice(0, seriesPoints[index].length - window);
      }
    }

    scheduleRender(false);
  };

  const finish = () => {
    if (isFinished) {
      return;
    }

    isFinished = true;

    if (renderTimer) {
      clearTimeout(renderTimer);
      renderTimer = undefined;
    }

    process.off('SIGWINCH', onResize);
    process.off('SIGINT', onSigInt);

    if (hasPendingRender || seriesPoints[0].length > 0) {
      scheduleRender(true);
    }

    plotStream.write('\n');
    process.exit(0);
  };

  const onResize = () => {
    scheduleRender(true);
  };

  const stream = readline.createInterface({
    input: process.stdin,
    crlfDelay: Infinity,
    terminal: false,
  });

  const onSigInt = () => {
    stream.close();
    finish();
  };

  process.on('SIGWINCH', onResize);
  process.on('SIGINT', onSigInt);

  stream.on('line', (line) => {
    if (passthrough) {
      process.stdout.write(`${line}\n`);
    }

    const parsed = parseStreamSample({
      line,
      lastAutoX: nextAutoX,
      seriesCount,
    });
    nextAutoX = parsed.nextAutoX;

    if ('x' in parsed) {
      addSample(parsed);
    }
  });

  stream.on('close', finish);
};

const reportError = (error: unknown, verbose: boolean) => {
  const primaryMessage =
    error instanceof CliError
      ? error.message
      : error instanceof Error
        ? error.message
        : `Unexpected error: ${String(error)}`;

  process.stderr.write(`${primaryMessage}\n`);

  if (verbose) {
    if (error instanceof CliError && error.cause instanceof Error && error.cause.stack) {
      process.stderr.write(`${error.cause.stack}\n`);
    } else if (error instanceof Error && error.stack) {
      process.stderr.write(`${error.stack}\n`);
    }
  }

  process.exit(1);
};

const run = async (argumentsInput: CliArguments) => {
  if (argumentsInput.passthrough && !argumentsInput.stream) {
    fail('--passthrough is only supported with --stream mode');
  }

  if (argumentsInput.rate && !argumentsInput.stream) {
    fail('--rate is only supported with --stream mode');
  }

  const warnings: string[] = [];
  const parsedOptions = preparePlotOptions({
    ...argumentsInput,
    mode: argumentsInput.mode as CliGraphMode | undefined,
    onWarning: (message) => warnings.push(message),
  });

  warnings.forEach((message) => {
    process.stderr.write(`Warning: ${message}\n`);
  });

  const plotOutput = (argumentsInput.plotOutput ??
    (argumentsInput.passthrough ? 'stderr' : 'stdout')) as PlotOutputTarget;

  if (argumentsInput.stream) {
    executeStream({
      options: parsedOptions,
      plotOutput,
      refreshMs: argumentsInput.refreshMs ?? 200,
      seriesCount: argumentsInput.series ?? 1,
      rateEnabled: argumentsInput.rate ?? false,
      window: argumentsInput.window ?? 60,
      passthrough: argumentsInput.passthrough ?? false,
    });

    return;
  }

  const input = await getStaticInput(argumentsInput);
  executeStatic({
    input,
    options: parsedOptions,
    plotOutput,
  });
};

const { argv } = yargs
  .option('input', {
    alias: 'i',
    type: 'string',
    description: 'Inline data payload. Usually JSON coordinates (for example [[1,2],[2,3]])',
  })
  .option('inputFile', {
    alias: ['input-file'],
    type: 'string',
    description: 'Read input data from a file path',
  })
  .option('format', {
    choices: ['json', 'csv', 'tsv', 'space'] as const,
    description: 'Input format for --input-file or stdin. Auto-detected when omitted',
  })
  .option('delimiter', {
    type: 'string',
    description: 'Custom delimiter for delimited formats',
  })
  .option('header', {
    type: 'boolean',
    default: false,
    description: 'Treat the first row in delimited input as a header row',
  })
  .option('xCol', {
    alias: ['x-col'],
    type: 'string',
    description: 'X column selector for delimited input (1-based index or header name)',
  })
  .option('yCol', {
    alias: ['y-col'],
    type: 'string',
    description: 'Y column selector for delimited input (1-based index or header name)',
  })
  .option('stream', {
    type: 'boolean',
    default: false,
    description: 'Enable streaming mode and read newline-delimited samples from stdin',
  })
  .option('window', {
    type: 'number',
    default: 60,
    description: 'Maximum number of recent samples to keep in stream mode',
  })
  .option('refreshMs', {
    alias: ['refresh-ms'],
    type: 'number',
    default: 200,
    description: 'Minimum render interval in milliseconds for stream mode',
  })
  .option('rate', {
    type: 'boolean',
    default: false,
    description: 'Treat stream values as counters and plot per-second rates',
  })
  .option('series', {
    choices: [1, 2] as const,
    default: 1,
    description: 'Number of stream series to parse per line',
  })
  .option('passthrough', {
    type: 'boolean',
    default: false,
    description: 'Forward incoming stream lines to stdout while plotting',
  })
  .option('plotOutput', {
    alias: ['plot-output'],
    choices: ['stdout', 'stderr'] as const,
    description: 'Output stream used for chart rendering',
  })
  .option('options', {
    alias: 'o',
    type: 'string',
    description: 'Plot settings (JSON object)',
  })
  .option('height', {
    alias: 'h',
    type: 'number',
    description: 'Height of the plot',
  })
  .option('hideXAxis', {
    type: 'boolean',
    description: 'Hide the x-axis if set to true',
  })
  .option('mode', {
    choices: GRAPH_MODES,
    description: 'Plot mode',
  })
  .option('debugMode', {
    alias: ['debug-mode'],
    type: 'boolean',
    description: 'Enable debug mode in the chart engine',
  })
  .option('hideYAxis', {
    type: 'boolean',
    description: 'Hide the y-axis if set to true',
  })
  .option('fillArea', {
    type: 'boolean',
    description: 'Fill the plot area if set to true',
  })
  .option('width', {
    alias: 'w',
    type: 'number',
    description: 'Width of the plot',
  })
  .option('title', {
    alias: 't',
    type: 'string',
    description: 'Title for the plot',
  })
  .option('xLabel', {
    type: 'string',
    description: 'Label for the x-axis',
  })
  .option('yLabel', {
    type: 'string',
    description: 'Label for the y-axis',
  })
  .option('color', {
    alias: 'c',
    type: 'array',
    description: 'Array of ANSI colors for plot elements',
  })
  .option('axisCenter', {
    type: 'array',
    description: 'Center coordinates for axis alignment',
  })
  .option('yRange', {
    type: 'array',
    description: 'Range for the y-axis, formatted as [min, max]',
  })
  .option('showTickLabel', {
    type: 'boolean',
    description: 'Show tick labels on the axis if set to true',
  })
  .option('thresholds', {
    type: 'array',
    description:
      'Threshold markers: JSON object/array string (for example \'{"y":2}\' or \'[{"y":2}]\') or tokenized JSON objects',
  })
  .option('points', {
    type: 'array',
    description:
      'Point markers: JSON object/array string (for example \'{"x":1,"y":2}\' or \'[{"x":1,"y":2}]\') or tokenized JSON objects',
  })
  .option('legend', {
    type: 'string',
    description: 'Legend settings (position and series labels)',
  })
  .option('formatter', {
    type: 'string',
    description: 'Custom formatter for axis values, as a JavaScript function',
  })
  .option('lineFormatter', {
    type: 'string',
    description: 'Formatter for customizing line appearance, as a JavaScript function',
  })
  .option('symbols', {
    type: 'string',
    description: 'Custom symbols for axis, chart, and background',
  })
  .option('verbose', {
    type: 'boolean',
    default: false,
    description: 'Print verbose errors',
  })
  .check((argumentsInput) => {
    if (
      argumentsInput.window !== undefined &&
      (typeof argumentsInput.window !== 'number' ||
        !Number.isFinite(argumentsInput.window) ||
        argumentsInput.window <= 0)
    ) {
      throw new Error('window must be a positive number');
    }

    if (
      argumentsInput.refreshMs !== undefined &&
      (typeof argumentsInput.refreshMs !== 'number' ||
        !Number.isFinite(argumentsInput.refreshMs) ||
        argumentsInput.refreshMs < 0)
    ) {
      throw new Error('refreshMs must be a non-negative number');
    }

    if (
      argumentsInput.width !== undefined &&
      (typeof argumentsInput.width !== 'number' ||
        !Number.isFinite(argumentsInput.width) ||
        argumentsInput.width <= 0)
    ) {
      throw new Error('width must be a positive number');
    }

    if (
      argumentsInput.height !== undefined &&
      (typeof argumentsInput.height !== 'number' ||
        !Number.isFinite(argumentsInput.height) ||
        argumentsInput.height <= 0)
    ) {
      throw new Error('height must be a positive number');
    }

    return true;
  });

const runMain = async (parsedArguments: unknown) => {
  const args = parsedArguments as CliArguments;
  try {
    await run(args);
  } catch (error) {
    reportError(error, args.verbose ?? false);
  }
};

if (argv instanceof Promise) {
  argv.then((parsedArguments) => {
    runMain(parsedArguments);
  });
} else {
  runMain(argv);
}
