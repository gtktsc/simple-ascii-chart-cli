import {
  Color,
  Colors,
  CustomSymbol,
  Formatter,
  GraphPoint,
  Legend,
  LineFormatterArgs,
  MaybePoint,
  Symbols,
  Threshold,
} from 'simple-ascii-chart';

// Prepares parameters by parsing JSON inputs and merging with optional settings
// Define ANSI color types for validation
const ANSI_COLORS = new Set([
  'ansiRed',
  'ansiGreen',
  'ansiBlack',
  'ansiYellow',
  'ansiBlue',
  'ansiMagenta',
  'ansiCyan',
  'ansiWhite',
]);

const LEGEND_POSITIONS = new Set(['left', 'right', 'top', 'bottom']);

// Type guard to check if a value is a valid ANSI color
const isAnsiColor = (value: any): value is Color => ANSI_COLORS.has(value);

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

// Helper function to validate and format axisCenter as MaybePoint
export const validateAxisCenter = (axisCenter: (string | number)[] | undefined): MaybePoint => {
  if (!axisCenter || axisCenter.length !== 2) return undefined;
  const [x, y] = axisCenter;
  const xNumber = toFiniteNumber(x);
  const yNumber = toFiniteNumber(y);

  return xNumber !== undefined && yNumber !== undefined ? [xNumber, yNumber] : undefined;
};

// Helper function to validate and map colors to the Colors type
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

// Updated prepareParams function with validated colors and axisCenter handling
// Helper function to validate and format yRange as [number, number]
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
  return undefined; // Return undefined if the format is incorrect
};
// Helper function to validate and format thresholds as Threshold[]
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

// Helper function to validate and format thresholds as Threshold[]
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

// Helper function to validate and parse legend as Legend
export const validateLegend = (legend: string | undefined): Legend | undefined => {
  if (!legend) return undefined;

  try {
    const parsedLegend = JSON.parse(legend);
    if (typeof parsedLegend !== 'object' || parsedLegend === null || Array.isArray(parsedLegend)) {
      return undefined;
    }

    const candidate = parsedLegend as Record<string, unknown>;
    const normalized: Legend = {};

    if (candidate.position !== undefined) {
      if (typeof candidate.position !== 'string' || !LEGEND_POSITIONS.has(candidate.position)) {
        return undefined;
      }
      normalized.position = candidate.position as Legend['position'];
    }

    if (candidate.series !== undefined) {
      if (!isStringOrStringArray(candidate.series)) {
        return undefined;
      }
      normalized.series = candidate.series as Legend['series'];
    }

    if (candidate.points !== undefined) {
      if (!isStringOrStringArray(candidate.points)) {
        return undefined;
      }
      normalized.points = candidate.points as Legend['points'];
    }

    if (candidate.thresholds !== undefined) {
      if (!isStringOrStringArray(candidate.thresholds)) {
        return undefined;
      }
      normalized.thresholds = candidate.thresholds as Legend['thresholds'];
    }

    return Object.keys(normalized).length > 0 ? normalized : undefined;
  } catch {
    // Ignore JSON parsing errors and return undefined
  }
  return undefined;
};

// Helper function to parse a formatter string into a function of type Formatter
export const validateFormatter = (formatter: string | undefined): Formatter | undefined => {
  if (!formatter) return undefined;

  try {
    // Create a function from the formatter string; it should accept (value, helpers) parameters
    // Using `new Function` to construct a function from the string (in the form "value => { ... }")
    return new Function('value', 'helpers', `return (${formatter})(value, helpers);`) as Formatter;
  } catch {
    // Return undefined if the formatter string cannot be parsed as a function
    return undefined;
  }
};

// Helper function to parse lineFormatter string into a function of type (args: LineFormatterArgs) => CustomSymbol | CustomSymbol[]
export const validateLineFormatter = (
  lineFormatter: string | undefined,
): ((args: LineFormatterArgs) => CustomSymbol | CustomSymbol[]) | undefined => {
  if (!lineFormatter) return undefined;

  try {
    // Using `new Function` to construct a function from the lineFormatter string
    return new Function('args', `return (${lineFormatter})(args);`) as (
      args: LineFormatterArgs,
    ) => CustomSymbol | CustomSymbol[];
  } catch {
    // Return undefined if the lineFormatter string cannot be parsed as a function
    return undefined;
  }
};

// Helper function to parse and validate symbols as Symbols type
export const validateSymbols = (symbols: string | undefined): Symbols | undefined => {
  if (!symbols) return undefined;

  try {
    const parsedSymbols = JSON.parse(symbols);
    if (typeof parsedSymbols !== 'object' || parsedSymbols === null || Array.isArray(parsedSymbols)) {
      return undefined;
    }

    const candidate = parsedSymbols as Record<string, unknown>;
    const normalized: Symbols = {};

    const isObjectCandidate = (value: unknown): value is Record<string, unknown> =>
      typeof value === 'object' && value !== null && !Array.isArray(value);

    if (candidate.axis !== undefined) {
      if (!isObjectCandidate(candidate.axis)) {
        return undefined;
      }
      normalized.axis = candidate.axis as Symbols['axis'];
    }

    if (candidate.chart !== undefined) {
      if (!isObjectCandidate(candidate.chart)) {
        return undefined;
      }
      normalized.chart = candidate.chart as Symbols['chart'];
    }

    if (candidate.thresholds !== undefined) {
      if (!isObjectCandidate(candidate.thresholds)) {
        return undefined;
      }
      normalized.thresholds = candidate.thresholds as Symbols['thresholds'];
    }

    if (candidate.empty !== undefined) {
      if (typeof candidate.empty !== 'string') {
        return undefined;
      }
      normalized.empty = candidate.empty;
    }

    if (candidate.background !== undefined) {
      if (typeof candidate.background !== 'string') {
        return undefined;
      }
      normalized.background = candidate.background;
    }

    if (candidate.border !== undefined) {
      if (typeof candidate.border !== 'string') {
        return undefined;
      }
      normalized.border = candidate.border;
    }

    if (candidate.point !== undefined) {
      if (typeof candidate.point !== 'string') {
        return undefined;
      }
      normalized.point = candidate.point;
    }

    return Object.keys(normalized).length > 0 ? normalized : undefined;
  } catch {
    // Return undefined if symbols string cannot be parsed
    return undefined;
  }
};
