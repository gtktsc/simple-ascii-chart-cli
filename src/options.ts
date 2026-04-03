import { Settings } from 'simple-ascii-chart';
import {
  validateFormatter,
  validateLineFormatter,
  validateSymbols,
  validateAxisCenter,
  validateColors,
  validateLegend,
  validateThresholds,
  validateYRange,
  validatePoints,
} from './validators';

export const GRAPH_MODES = ['line', 'point', 'bar', 'horizontalBar'] as const;

export type CliGraphMode = (typeof GRAPH_MODES)[number];

export type CliSettingsInput = {
  options?: string;
  title?: string;
  xLabel?: string;
  yLabel?: string;
  width?: number;
  height?: number;
  fillArea?: boolean;
  hideYAxis?: boolean;
  hideXAxis?: boolean;
  color?: (string | number)[] | string;
  axisCenter?: (string | number)[];
  yRange?: (string | number)[];
  showTickLabel?: boolean;
  thresholds?: unknown;
  points?: unknown;
  legend?: string;
  formatter?: string;
  lineFormatter?: string;
  symbols?: string;
  mode?: CliGraphMode;
  debugMode?: boolean;
  onWarning?: (message: string) => void;
};

export const preparePlotOptions = ({
  options,
  width,
  height,
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
      const details = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid --options JSON: ${details}`);
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

  assignIfDefined('width', width);
  assignIfDefined('height', height);
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
      'Invalid --legend JSON: expected an object with optional position (left|right|top|bottom) and string/string[] labels for series/points/thresholds',
    );
  }
  assignIfDefined('legend', parsedLegend);
  assignIfDefined('formatter', validateFormatter(formatter));
  assignIfDefined('lineFormatter', validateLineFormatter(lineFormatter));
  assignIfDefined('symbols', validateSymbols(symbols));

  return mergedOptions;
};
