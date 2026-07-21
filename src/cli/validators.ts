import {
  type Color,
  type Colors,
  type CustomSymbol,
  type Formatter,
  type GraphPoint,
  type Legend,
  type LineFormatterArgs,
  type MaybePoint,
  type Symbols,
  type Threshold,
} from 'simple-ascii-chart';

import {
  ANSI_COLORS,
  LEGEND_LABEL_FIELDS,
  LEGEND_POSITIONS,
  SYMBOL_OBJECT_FIELDS,
  SYMBOL_STRING_FIELDS,
} from './constants';

// Type guard to check if a value is a valid ANSI color
const isAnsiColor = (value: unknown): value is Color =>
  typeof value === 'string' && ANSI_COLORS.has(value);

/**
 * Accepts a supported ANSI color name.
 *
 * @param {string | undefined} value - Candidate color.
 * @returns {Color | undefined} Valid color or undefined.
 */
export const validateColor = (value: string | undefined): Color | undefined =>
  value !== undefined && isAnsiColor(value) ? value : undefined;

const toFiniteNumber = (value: string | number): number | undefined => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const parseJsonFragment = (value: string): unknown | undefined => {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
};

const isObjectCandidate = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isStringOrStringArray = (value: unknown): value is string | string[] => {
  return typeof value === 'string' || (Array.isArray(value) && value.every((item) => typeof item === 'string'));
};

const collectObjectCandidates = (value: unknown): unknown[] => {
  if (value === undefined || value === null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectObjectCandidates(item));
  }

  if (typeof value === 'string') {
    const parsed = parseJsonFragment(value.trim());
    return parsed === undefined ? [] : collectObjectCandidates(parsed);
  }

  if (typeof value === 'object') {
    return [value];
  }

  return [];
};

/**
 * Normalizes a two-value axis center.
 *
 * @param {Array<string | number> | undefined} axisCenter - Candidate center values.
 * @returns {MaybePoint} Normalized point or undefined.
 */
export const validateAxisCenter = (axisCenter: (string | number)[] | undefined): MaybePoint => {
  if (!axisCenter || axisCenter.length !== 2) return undefined;
  const [x, y] = axisCenter;
  const xNumber = toFiniteNumber(x);
  const yNumber = toFiniteNumber(y);

  return xNumber !== undefined && yNumber !== undefined ? [xNumber, yNumber] : undefined;
};

/**
 * Filters one or more supported ANSI colors.
 *
 * @param {Array<string | number> | string | undefined} colors - Candidate colors.
 * @returns {Colors | undefined} Valid colors or undefined.
 */
export const validateColors = (
  colors: (string | number)[] | string | undefined,
): Colors | undefined => {
  if (Array.isArray(colors)) {
    const filteredColors = colors.filter(isAnsiColor) as Color[];
    return filteredColors.length > 0 ? filteredColors : undefined;
  } else if (typeof colors === 'string' && isAnsiColor(colors)) {
    return colors as Color;
  }
  return undefined;
};

/**
 * Normalizes a numeric y-axis range.
 *
 * @param {Array<string | number> | undefined} yRange - Candidate range.
 * @returns {Array<number> | undefined} Numeric range or undefined.
 */
export const validateYRange = (
  yRange: (string | number)[] | undefined,
): [number, number] | undefined => {
  if (Array.isArray(yRange) && yRange.length === 2) {
    const [min, max] = yRange;
    const minNumber = toFiniteNumber(min);
    const maxNumber = toFiniteNumber(max);

    if (minNumber !== undefined && maxNumber !== undefined) {
      return [minNumber, maxNumber];
    }
  }
  return undefined;
};

/**
 * Parses and validates threshold marker input.
 *
 * @param {unknown} thresholds - JSON-compatible threshold input.
 * @returns {Array<Threshold> | undefined} Valid markers or undefined.
 */
export const validateThresholds = (
  thresholds: unknown,
): Threshold[] | undefined => {
  const candidates = collectObjectCandidates(thresholds);
  const validated = candidates
    .map((item) => {
      const threshold = item as Record<string, unknown>;
      const x = toFiniteNumber(threshold.x as string | number);
      const y = toFiniteNumber(threshold.y as string | number);
      const color = typeof threshold.color === 'string' ? threshold.color : undefined;

      return x !== undefined || y !== undefined ? ({ x, y, color } as Threshold) : undefined;
    })
    .filter((threshold): threshold is Threshold => threshold !== undefined);

  return validated.length > 0 ? validated : undefined;
};

/**
 * Parses and validates point marker input.
 *
 * @param {unknown} points - JSON-compatible point input.
 * @returns {Array<GraphPoint> | undefined} Valid markers or undefined.
 */
export const validatePoints = (
  points: unknown,
): GraphPoint[] | undefined => {
  const candidates = collectObjectCandidates(points);
  const validated = candidates
    .map((item) => {
      const point = item as Record<string, unknown>;
      const x = toFiniteNumber(point.x as string | number);
      const y = toFiniteNumber(point.y as string | number);
      const color = typeof point.color === 'string' ? point.color : undefined;

      return x !== undefined && y !== undefined ? ({ x, y, color } as GraphPoint) : undefined;
    })
    .filter((point): point is GraphPoint => point !== undefined);

  return validated.length > 0 ? validated : undefined;
};

/**
 * Parses and validates legend settings.
 *
 * @param {string | undefined} legend - Raw legend JSON.
 * @returns {Legend | undefined} Valid legend or undefined.
 */
export const validateLegend = (legend: string | undefined): Legend | undefined => {
  if (!legend) return undefined;

  const parsedLegend = parseJsonFragment(legend);
  if (!isObjectCandidate(parsedLegend)) return undefined;

  const normalized: Legend = {};
  if (parsedLegend.position !== undefined) {
    if (
      typeof parsedLegend.position !== 'string' ||
      !LEGEND_POSITIONS.has(parsedLegend.position)
    ) {
      return undefined;
    }
    normalized.position = parsedLegend.position as Legend['position'];
  }

  for (const field of LEGEND_LABEL_FIELDS) {
    const value = parsedLegend[field];
    if (value === undefined) continue;
    if (!isStringOrStringArray(value)) return undefined;
    Object.assign(normalized, { [field]: value });
  }

  if (parsedLegend.color !== undefined) {
    if (!isAnsiColor(parsedLegend.color)) return undefined;
    normalized.color = parsedLegend.color;
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
};

/**
 * Compiles a value formatter supplied on the command line.
 *
 * @param {string | undefined} formatter - JavaScript formatter expression.
 * @returns {Formatter | undefined} Compiled formatter or undefined.
 */
export const validateFormatter = (formatter: string | undefined): Formatter | undefined => {
  if (!formatter) return undefined;

  try {
    return new Function('value', 'helpers', `return (${formatter})(value, helpers);`) as Formatter;
  } catch {
    return undefined;
  }
};

/**
 * Compiles a line formatter supplied on the command line.
 *
 * @param {string | undefined} lineFormatter - JavaScript formatter expression.
 * @returns {Function | undefined} Compiled formatter or undefined.
 */
export const validateLineFormatter = (
  lineFormatter: string | undefined,
): ((args: LineFormatterArgs) => CustomSymbol | CustomSymbol[]) | undefined => {
  if (!lineFormatter) return undefined;

  try {
    return new Function('args', `return (${lineFormatter})(args);`) as (
      args: LineFormatterArgs,
    ) => CustomSymbol | CustomSymbol[];
  } catch {
    return undefined;
  }
};

const copySymbolFields = (
  candidate: Record<string, unknown>,
  normalized: Symbols,
): boolean => {
  for (const field of SYMBOL_OBJECT_FIELDS) {
    const value = candidate[field];
    if (value === undefined) continue;
    if (!isObjectCandidate(value)) return false;
    Object.assign(normalized, { [field]: value });
  }

  for (const field of SYMBOL_STRING_FIELDS) {
    const value = candidate[field];
    if (value === undefined) continue;
    if (typeof value !== 'string') return false;
    Object.assign(normalized, { [field]: value });
  }

  return true;
};

/**
 * Parses and validates custom chart symbols.
 *
 * @param {string | undefined} symbols - Raw symbols JSON.
 * @returns {Symbols | undefined} Valid symbols or undefined.
 */
export const validateSymbols = (symbols: string | undefined): Symbols | undefined => {
  if (!symbols) return undefined;

  const parsedSymbols = parseJsonFragment(symbols);
  if (!isObjectCandidate(parsedSymbols)) return undefined;

  const normalized: Symbols = {};
  if (!copySymbolFields(parsedSymbols, normalized)) return undefined;

  return Object.keys(normalized).length > 0 ? normalized : undefined;
};
