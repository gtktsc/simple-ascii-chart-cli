import {
  DEFAULT_REFRESH_MS,
  DEFAULT_STREAM_SERIES_COUNT,
  DEFAULT_STREAM_WINDOW,
} from './constants';
import { fail, reportError } from './errors';
import { getJsonInput, getStaticInput } from './input';
import { preparePlotOptions } from './options';
import { parseJsonObject, renderApiMethod } from './render';
import { executeStatic, executeStream } from './stream';

import type { CliArguments, PlotOutputTarget } from './types';

const validateModeArguments = (args: CliArguments): void => {
  if (args.passthrough && !args.stream) {
    fail('--passthrough is only supported with --stream mode');
  }
  if (args.rate && !args.stream) {
    fail('--rate is only supported with --stream mode');
  }
  if (args.stream && (args.method ?? 'plot') !== 'plot') {
    fail('--stream is only supported with --method plot');
  }
};

const getPlotOutput = (args: CliArguments): PlotOutputTarget =>
  args.plotOutput ?? (args.passthrough ? 'stderr' : 'stdout');

const runPlot = async (args: CliArguments, plotOutput: PlotOutputTarget): Promise<void> => {
  const warnings: string[] = [];
  const parsedOptions = preparePlotOptions({
    ...args,
    onWarning: (message) => warnings.push(message),
  });
  warnings.forEach((message) => {
    process.stderr.write(`Warning: ${message}\n`);
  });

  if (args.stream) {
    executeStream({
      options: parsedOptions,
      plotOutput,
      refreshMs: args.refreshMs ?? DEFAULT_REFRESH_MS,
      seriesCount: args.series ?? DEFAULT_STREAM_SERIES_COUNT,
      rateEnabled: args.rate ?? false,
      window: args.window ?? DEFAULT_STREAM_WINDOW,
      passthrough: args.passthrough ?? false,
    });

    return;
  }

  const input = await getStaticInput(args);
  executeStatic(renderApiMethod('plot', input, parsedOptions as Record<string, unknown>), plotOutput);
};

/**
 * Executes one parsed CLI request.
 *
 * @param {CliArguments} args - Parsed CLI arguments.
 * @returns {Promise<void>} Completion signal for static rendering.
 */
export const run = async (args: CliArguments): Promise<void> => {
  validateModeArguments(args);
  const method = args.method ?? 'plot';
  const plotOutput = getPlotOutput(args);

  if (method === 'plot') {
    await runPlot(args, plotOutput);

    return;
  }

  const input = await getJsonInput(args);
  const options = parseJsonObject(args.options, 'options');
  executeStatic(renderApiMethod(method, input, options), plotOutput);
};

/**
 * Executes parsed arguments and owns top-level error reporting.
 *
 * @param {CliArguments} args - Parsed CLI arguments.
 * @returns {Promise<void>} Completion signal.
 */
export const runMain = async (args: CliArguments): Promise<void> => {
  try {
    await run(args);
  } catch (error) {
    reportError(error, args.verbose ?? false);
  }
};
