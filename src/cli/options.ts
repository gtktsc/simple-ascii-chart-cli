import {
  type ChartWidth,
  type Settings,
} from 'simple-ascii-chart';

import {
  validateAxisCenter,
  validateColor,
  validateColors,
  validateFormatter,
  validateLegend,
  validateLineFormatter,
  validatePoints,
  validateSymbols,
  validateThresholds,
  validateYRange,
} from './validators';

import type { CliSettingsInput } from './types';

const parseJsonValue = (optionName: string, value: string | undefined): unknown | undefined => {
  if (value === undefined) return undefined;

  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`Invalid --${optionName} JSON: ${String(error)}`, { cause: error });
  }
};

const parseJsonObject = <T>(optionName: string, value: string | undefined): T | undefined => {
  const parsed = parseJsonValue(optionName, value);
  if (parsed === undefined) return undefined;
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`Invalid --${optionName} JSON: expected an object`);
  }
  return parsed as T;
};

const toNumberArray = (values: (string | number)[] | undefined): number[] | undefined => {
  if (values === undefined) return undefined;
  const parsed = values.map((value) => Number(value));
  return parsed.every(Number.isFinite) ? parsed : undefined;
};

const toChartWidth = (value: number | string | undefined): ChartWidth | undefined => {
  if (value === undefined || value === 'auto') return value;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return parsed;
};

/**
 * Converts CLI plot fields into simple-ascii-chart settings.
 *
 * @param {CliSettingsInput} root0 - Parsed CLI plot fields.
 * @returns {Settings} Validated chart settings.
 */
export const preparePlotOptions = ({
  options,
  width,
  height,
  aspectRatio,
  hideYAxis,
  hideXAxis,
  fillArea,
  title,
  xLabel,
  yLabel,
  color,
  axisCenter,
  yRange,
  showTickLabel,
  hideXAxisTicks,
  hideYAxisTicks,
  customXAxisTicks,
  customYAxisTicks,
  titleColor,
  borderColor,
  backgroundColor,
  overflow,
  renderer,
  interpolation,
  coloring,
  barLayout,
  valueLabels,
  xAxis,
  yAxis,
  thresholds,
  points,
  legend,
  formatter,
  lineFormatter,
  symbols,
  mode,
  debugMode,
  onWarning,
}: CliSettingsInput): Settings => {
  let currentOptions: Settings = {};
  if (options) {
    try {
      currentOptions = JSON.parse(options) as Settings;
    } catch (error) {
      throw new Error(`Invalid --options JSON: ${String(error)}`, { cause: error });
    }
  }

  const mergedOptions: Settings = {
    ...currentOptions,
  };

  const assignIfDefined = <T extends keyof Settings>(key: T, value: Settings[T] | undefined) => {
    if (value !== undefined) {
      mergedOptions[key] = value;
    }
  };

  assignIfDefined('width', toChartWidth(width));
  assignIfDefined('height', height);
  assignIfDefined('aspectRatio', aspectRatio);
  assignIfDefined('hideYAxis', hideYAxis);
  assignIfDefined('hideXAxis', hideXAxis);
  assignIfDefined('title', title);
  assignIfDefined('xLabel', xLabel);
  assignIfDefined('yLabel', yLabel);
  assignIfDefined('fillArea', fillArea);
  assignIfDefined('mode', mode);
  assignIfDefined('debugMode', debugMode);
  assignIfDefined('color', color ? validateColors(color) : undefined);
  assignIfDefined('axisCenter', validateAxisCenter(axisCenter));
  assignIfDefined('yRange', validateYRange(yRange));
  assignIfDefined('showTickLabel', showTickLabel);
  assignIfDefined('hideXAxisTicks', hideXAxisTicks);
  assignIfDefined('hideYAxisTicks', hideYAxisTicks);
  assignIfDefined('customXAxisTicks', toNumberArray(customXAxisTicks));
  assignIfDefined('customYAxisTicks', toNumberArray(customYAxisTicks));
  assignIfDefined('titleColor', validateColor(titleColor));
  assignIfDefined('borderColor', validateColor(borderColor));
  assignIfDefined('backgroundColor', validateColor(backgroundColor));
  assignIfDefined('overflow', overflow);
  assignIfDefined('renderer', renderer);
  assignIfDefined('interpolation', interpolation);
  assignIfDefined('coloring', parseJsonValue('coloring', coloring) as Settings['coloring']);
  assignIfDefined('barLayout', barLayout);
  assignIfDefined(
    'valueLabels',
    parseJsonValue('value-labels', valueLabels) as Settings['valueLabels'],
  );
  assignIfDefined('xAxis', parseJsonObject<Settings['xAxis']>('x-axis', xAxis));
  assignIfDefined('yAxis', parseJsonObject<Settings['yAxis']>('y-axis', yAxis));
  const parsedThresholds = validateThresholds(thresholds);
  if (thresholds !== undefined && parsedThresholds === undefined && onWarning) {
    onWarning(
      'Ignoring invalid --thresholds payload. Use JSON object/array (e.g. {"y":2} or [{"y":2}]).',
    );
  }
  assignIfDefined('thresholds', parsedThresholds);

  const parsedPoints = validatePoints(points);
  if (points !== undefined && parsedPoints === undefined && onWarning) {
    onWarning(
      'Ignoring invalid --points payload. Use JSON object/array (e.g. {"x":1,"y":2} or [{"x":1,"y":2}]).',
    );
  }
  assignIfDefined('points', parsedPoints);
  const parsedLegend = validateLegend(legend);
  if (legend !== undefined && parsedLegend === undefined) {
    throw new Error(
      'Invalid --legend JSON: expected optional position (left|right|top|bottom|auto), ANSI color, and string/string[] labels for series/points/thresholds',
    );
  }
  assignIfDefined('legend', parsedLegend);
  assignIfDefined('formatter', validateFormatter(formatter));
  assignIfDefined('lineFormatter', validateLineFormatter(lineFormatter));
  assignIfDefined('symbols', validateSymbols(symbols));

  return mergedOptions;
};
