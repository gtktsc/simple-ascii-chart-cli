import {
  Color,
  Colors,
  CustomSymbol,
  Formatter,
  Legend,
  LineFormatterArgs,
  MaybePoint,
  Symbols,
  Threshold,
} from 'simple-ascii-chart/dist/types';

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

// Type guard to check if a value is a valid ANSI color
const isAnsiColor = (value: any): value is Color => ANSI_COLORS.has(value);

// Helper function to validate and format axisCenter as MaybePoint
export const validateAxisCenter = (axisCenter: (string | number)[] | undefined): MaybePoint => {
  if (!axisCenter || axisCenter.length !== 2) return undefined;
  const [x, y] = axisCenter;
  return typeof x === 'number' && typeof y === 'number' ? [x, y] : undefined;
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
    // Ensure both elements are numbers
    if (typeof min === 'number' && typeof max === 'number') {
      return [min, max];
    }
  }
  return undefined; // Return undefined if the format is incorrect
};
// Helper function to validate and format thresholds as Threshold[]
export const validateThresholds = (
  thresholds: any[] | undefined, // Updated type to any[] | undefined
): Threshold[] | undefined => {
  if (!Array.isArray(thresholds)) return undefined;

  return thresholds
    .map((item) => {
      if (typeof item === 'object' && item !== null) {
        const threshold = item as any;
        const x = typeof threshold.x === 'number' ? threshold.x : undefined;
        const y = typeof threshold.y === 'number' ? threshold.y : undefined;
        const color = typeof threshold.color === 'string' ? threshold.color : undefined;

        return x !== undefined || y !== undefined ? ({ x, y, color } as Threshold) : undefined;
      }
      return undefined;
    })
    .filter((threshold): threshold is Threshold => threshold !== undefined);
};

// Helper function to validate and parse legend as Legend
export const validateLegend = (legend: string | undefined): Legend | undefined => {
  if (!legend) return undefined;

  try {
    // Attempt to parse the legend string as JSON
    const parsedLegend = JSON.parse(legend);
    // Check if parsed legend has the correct structure for the Legend type
    if (
      (typeof parsedLegend.position === 'string' &&
        ['left', 'right', 'top', 'bottom'].includes(parsedLegend.position)) ||
      parsedLegend.series instanceof Array
    ) {
      return parsedLegend as Legend;
    }
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
    // Parse the symbols JSON string
    const parsedSymbols = JSON.parse(symbols);
    // Check if parsedSymbols has the correct structure
    if (
      typeof parsedSymbols === 'object' &&
      (parsedSymbols.axis ||
        parsedSymbols.chart ||
        parsedSymbols.empty ||
        parsedSymbols.background ||
        parsedSymbols.border)
    ) {
      return parsedSymbols as Symbols;
    }
  } catch {
    // Return undefined if symbols string cannot be parsed
    return undefined;
  }
  return undefined;
};
