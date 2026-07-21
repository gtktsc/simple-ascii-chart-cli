/** Public simple-ascii-chart methods exposed by --method. */
export const API_METHODS = [
  'plot',
  'renderChart',
  'candlestick',
  'heatmap',
  'sparkline',
  'histogram',
] as const;

/** Bar layouts accepted by --bar-layout. */
export const BAR_LAYOUTS = ['overlap', 'grouped', 'stacked', 'normalized'] as const;

/** ANSI color names accepted by chart options. */
export const ANSI_COLORS: ReadonlySet<string> = new Set([
  'ansiRed',
  'ansiGreen',
  'ansiBlack',
  'ansiYellow',
  'ansiBlue',
  'ansiMagenta',
  'ansiCyan',
  'ansiWhite',
  'ansiBrightBlack',
  'ansiBrightRed',
  'ansiBrightGreen',
  'ansiBrightYellow',
  'ansiBrightBlue',
  'ansiBrightMagenta',
  'ansiBrightCyan',
  'ansiBrightWhite',
]);

/** Terminal sequence used to clear the active screen. */
export const CLEAR_SCREEN_SEQUENCE = '\x1b[2J\x1b[H';

/** Default simple-ascii-chart API method. */
export const DEFAULT_API_METHOD = 'plot' as const;

/** Default minimum interval between stream renders. */
export const DEFAULT_REFRESH_MS = 200;

/** Default number of stream series. */
export const DEFAULT_STREAM_SERIES_COUNT = 1;

/** Default number of retained stream samples. */
export const DEFAULT_STREAM_WINDOW = 60;

/** Width removed from terminal columns when deriving chart width. */
export const DYNAMIC_PLOT_WIDTH_PADDING = 8;

/** Plot modes accepted by --mode. */
export const GRAPH_MODES = ['line', 'point', 'bar', 'horizontalBar'] as const;

/** Input formats accepted by --format. */
export const INPUT_FORMATS = ['json', 'csv', 'tsv', 'space'] as const;

/** Interpolation strategies accepted by --interpolation. */
export const INTERPOLATIONS = ['step', 'linear'] as const;

/** Legend positions accepted by legend validation. */
export const LEGEND_POSITIONS: ReadonlySet<string> = new Set([
  'left',
  'right',
  'top',
  'bottom',
  'auto',
]);

/** Legend fields accepting string labels. */
export const LEGEND_LABEL_FIELDS = ['series', 'points', 'thresholds'] as const;

/** Minimum dynamic chart width. */
export const MIN_DYNAMIC_PLOT_WIDTH = 10;

/** Overflow behaviors accepted by --overflow. */
export const OVERFLOWS = ['clip', 'discard'] as const;

/** Process streams accepted by --plot-output. */
export const PLOT_OUTPUT_TARGETS = ['stdout', 'stderr'] as const;

/** Rendering backends accepted by --renderer. */
export const RENDERERS = ['ascii', 'braille'] as const;

/** Stream series counts accepted by --series. */
export const STREAM_SERIES_COUNTS = [1, 2] as const;

/** Symbol fields requiring object values. */
export const SYMBOL_OBJECT_FIELDS = [
  'axis',
  'chart',
  'thresholds',
  'candlestick',
  'annotations',
] as const;

/** Symbol fields requiring string values. */
export const SYMBOL_STRING_FIELDS = [
  'empty',
  'background',
  'border',
  'point',
  'ellipsis',
] as const;

/** Terminal column fallback used when stream metadata is unavailable. */
export const TERMINAL_FALLBACK_COLUMNS = 80;
