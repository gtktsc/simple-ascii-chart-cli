import {
  candlestick,
  type CandlestickSpec,
  type ChartSpec,
  heatmap,
  type HeatmapSpec,
  histogram,
  type HistogramData,
  type HistogramOptions,
  plot,
  type PlotCoordinates,
  renderChart,
  type Settings,
  sparkline,
  type SparklineOptions,
} from 'simple-ascii-chart';

import type { ApiMethod, JsonObject } from './types';

const isJsonObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Parses a CLI JSON object option.
 *
 * @param {string | undefined} value - Raw JSON value.
 * @param {string} optionName - Option name used in errors.
 * @returns {JsonObject | undefined} Parsed object when supplied.
 */
export const parseJsonObject = (
  value: string | undefined,
  optionName: string,
): JsonObject | undefined => {
  if (value === undefined) return undefined;

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid --${optionName} JSON: ${details}`, { cause: error });
  }

  if (!isJsonObject(parsed)) {
    throw new Error(`Invalid --${optionName} JSON: expected an object`);
  }

  return parsed;
};

const createSpec = (
  input: unknown,
  options: JsonObject | undefined,
  inputKey: 'data' | 'series',
): JsonObject => {
  if (isJsonObject(input)) {
    return { ...(options ?? {}), ...input };
  }

  return { ...(options ?? {}), [inputKey]: input };
};

/**
 * Dispatches input to a supported simple-ascii-chart method.
 *
 * @param {ApiMethod} method - API method to invoke.
 * @param {unknown} input - Method input payload.
 * @param {JsonObject | undefined} options - Optional method settings.
 * @returns {string} Rendered method output.
 */
export const renderApiMethod = (
  method: ApiMethod,
  input: unknown,
  options?: JsonObject,
): string => {
  switch (method) {
    case 'plot':
      return plot(input as PlotCoordinates, options as Settings | undefined);
    case 'renderChart':
      return renderChart(createSpec(input, options, 'series') as ChartSpec);
    case 'candlestick':
      return candlestick(createSpec(input, options, 'data') as CandlestickSpec);
    case 'heatmap':
      return heatmap(createSpec(input, options, 'data') as HeatmapSpec);
    case 'sparkline':
      return sparkline(
        input as readonly (number | null)[],
        options as SparklineOptions | undefined,
      );
    case 'histogram':
      return `${JSON.stringify(
        Array.isArray(input) && Array.isArray(input[0])
          ? histogram(input as HistogramData)
          : histogram(input as readonly number[], options as HistogramOptions | undefined),
      )}\n`;
  }
};
