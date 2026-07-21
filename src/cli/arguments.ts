import * as yargs from 'yargs';

import {
  API_METHODS,
  BAR_LAYOUTS,
  DEFAULT_API_METHOD,
  DEFAULT_REFRESH_MS,
  DEFAULT_STREAM_SERIES_COUNT,
  DEFAULT_STREAM_WINDOW,
  GRAPH_MODES,
  INPUT_FORMATS,
  INTERPOLATIONS,
  OVERFLOWS,
  PLOT_OUTPUT_TARGETS,
  RENDERERS,
  STREAM_SERIES_COUNTS,
} from './constants';

import type { CliArguments } from './types';

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

const validateArguments = (argumentsInput: CliArguments): true => {
  if (argumentsInput.window !== undefined && !isPositiveNumber(argumentsInput.window)) {
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
    argumentsInput.width !== 'auto' &&
    (!Number.isFinite(Number(argumentsInput.width)) || Number(argumentsInput.width) <= 0)
  ) {
    throw new Error('width must be a positive number or auto');
  }
  if (argumentsInput.height !== undefined && !isPositiveNumber(argumentsInput.height)) {
    throw new Error('height must be a positive number');
  }
  if (
    argumentsInput.aspectRatio !== undefined &&
    !isPositiveNumber(argumentsInput.aspectRatio)
  ) {
    throw new Error('aspectRatio must be a positive number');
  }

  return true;
};

const parser = yargs
  .scriptName('simple-ascii-chart')
  .usage('$0 [options]')
  .option('method', {
    choices: API_METHODS,
    default: DEFAULT_API_METHOD,
    description: 'simple-ascii-chart API method to invoke',
  })
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
    choices: INPUT_FORMATS,
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
    default: DEFAULT_STREAM_WINDOW,
    description: 'Maximum number of recent samples to keep in stream mode',
  })
  .option('refreshMs', {
    alias: ['refresh-ms'],
    type: 'number',
    default: DEFAULT_REFRESH_MS,
    description: 'Minimum render interval in milliseconds for stream mode',
  })
  .option('rate', {
    type: 'boolean',
    default: false,
    description: 'Treat stream values as counters and plot per-second rates',
  })
  .option('series', {
    choices: STREAM_SERIES_COUNTS,
    default: DEFAULT_STREAM_SERIES_COUNT,
    description: 'Number of stream series to parse per line',
  })
  .option('passthrough', {
    type: 'boolean',
    default: false,
    description: 'Forward incoming stream lines to stdout while plotting',
  })
  .option('plotOutput', {
    alias: ['plot-output'],
    choices: PLOT_OUTPUT_TARGETS,
    description: 'Output stream used for chart rendering',
  })
  .option('options', {
    alias: 'o',
    type: 'string',
    description: 'Method options/spec fields (JSON object)',
  })
  .option('height', {
    alias: 'h',
    type: 'number',
    description: 'Height of the plot',
  })
  .option('aspectRatio', {
    alias: ['aspect-ratio'],
    type: 'number',
    description: 'Physical width-to-height ratio used to derive plot height',
  })
  .option('hideXAxis', {
    alias: ['hide-x-axis'],
    type: 'boolean',
    description: 'Hide the x-axis if set to true',
  })
  .option('hideXAxisTicks', {
    alias: ['hide-x-axis-ticks'],
    type: 'boolean',
    description: 'Hide x-axis ticks and labels while retaining the axis line',
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
    alias: ['hide-y-axis'],
    type: 'boolean',
    description: 'Hide the y-axis if set to true',
  })
  .option('hideYAxisTicks', {
    alias: ['hide-y-axis-ticks'],
    type: 'boolean',
    description: 'Hide y-axis ticks and labels while retaining the axis line',
  })
  .option('fillArea', {
    type: 'boolean',
    description: 'Fill the plot area if set to true',
  })
  .option('width', {
    alias: 'w',
    type: 'string',
    description: 'Positive plot width or auto',
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
    alias: ['show-tick-label'],
    type: 'boolean',
    description: 'Show tick labels on the axis if set to true',
  })
  .option('customXAxisTicks', {
    alias: ['custom-x-axis-ticks'],
    type: 'array',
    description: 'Explicit numeric x-axis tick values',
  })
  .option('customYAxisTicks', {
    alias: ['custom-y-axis-ticks'],
    type: 'array',
    description: 'Explicit numeric y-axis tick values',
  })
  .option('titleColor', {
    alias: ['title-color'],
    type: 'string',
    description: 'ANSI color for the title',
  })
  .option('borderColor', {
    alias: ['border-color'],
    type: 'string',
    description: 'ANSI color for the plot border',
  })
  .option('backgroundColor', {
    alias: ['background-color'],
    type: 'string',
    description: 'ANSI color for plot background glyphs',
  })
  .option('overflow', {
    choices: OVERFLOWS,
    description: 'Behavior for geometry outside explicit domains',
  })
  .option('renderer', {
    choices: RENDERERS,
    description: 'Plot-cell rendering backend',
  })
  .option('interpolation', {
    choices: INTERPOLATIONS,
    description: 'Line interpolation strategy',
  })
  .option('coloring', {
    type: 'string',
    description: 'Dynamic coloring configuration (JSON)',
  })
  .option('barLayout', {
    alias: ['bar-layout'],
    choices: BAR_LAYOUTS,
    description: 'Multi-series bar arrangement',
  })
  .option('valueLabels', {
    alias: ['value-labels'],
    type: 'string',
    description: 'Bar value-label configuration: true, false, or JSON object',
  })
  .option('xAxis', {
    alias: ['x-axis'],
    type: 'string',
    description: 'Structured x-axis options (JSON object)',
  })
  .option('yAxis', {
    alias: ['y-axis'],
    type: 'string',
    description: 'Structured y-axis options (JSON object)',
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
  .check((argumentsInput) => validateArguments(argumentsInput as CliArguments));

/**
 * Parses process arguments using the configured yargs contract.
 *
 * @returns {CliArguments | Promise<CliArguments>} Parsed CLI arguments.
 */
export const parseCliArguments = (): CliArguments | Promise<CliArguments> =>
  parser.argv as CliArguments | Promise<CliArguments>;
