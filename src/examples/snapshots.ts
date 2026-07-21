import { additionalMethodExamples } from './additional-methods';
import { additionalPlotExamples } from './additional-plot';
import {
  candlestickExamples,
  heatmapExamples,
  histogramExamples,
  renderChartExamples,
  sparklineExamples,
} from './methods';
import { plotExamples } from './plot';

import type { CliExample, CliResult } from './types';

const quoteArgument = (argument: string): string => {
  if (/^[\w./:=+-]+$/.test(argument)) return argument;

  return `'${argument.replaceAll("'", `'\\''`)}'`;
};

const showControlCharacters = (value: string): string =>
  value.replaceAll('\u001b', '\\x1b').replaceAll('\r', '\\r');

const formatStream = (value: string): string =>
  value === '' ? '<empty>\n' : `${showControlCharacters(value).replace(/\n?$/, '\n')}`;

/** Complete canonical registry of snapshot-backed CLI usage examples. */
export const cliSnapshotExamples: readonly CliExample[] = [
  ...plotExamples,
  ...renderChartExamples,
  ...candlestickExamples,
  ...heatmapExamples,
  ...sparklineExamples,
  ...histogramExamples,
  ...additionalPlotExamples,
  ...additionalMethodExamples,
];

/**
 * Formats one invocation and process result as a reviewable text snapshot.
 *
 * @param {CliExample} example - Executed usage example.
 * @param {CliResult} result - Captured CLI process result.
 * @returns {string} Stable snapshot text.
 */
export const formatCliSnapshot = (example: CliExample, result: CliResult): string =>
  [
    `$ simple-ascii-chart ${example.args.map(quoteArgument).join(' ')}`,
    example.stdin === undefined ? '' : `stdin:\n${showControlCharacters(example.stdin)}`,
    `exit code: ${result.code === null ? 'null' : result.code}`,
    `stdout:\n${formatStream(result.stdout)}`,
    `stderr:\n${formatStream(result.stderr)}`,
  ]
    .filter(Boolean)
    .join('\n');
