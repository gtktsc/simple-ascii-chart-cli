import type {
  BarLayout,
  Interpolation,
  Overflow,
  Renderer,
  Settings,
} from 'simple-ascii-chart';

/** Supported graph modes exposed by the CLI. */
export type CliGraphMode = 'line' | 'point' | 'bar' | 'horizontalBar';

/** Supported public simple-ascii-chart API methods. */
export type ApiMethod =
  | 'plot'
  | 'renderChart'
  | 'candlestick'
  | 'heatmap'
  | 'sparkline'
  | 'histogram';

/** JSON object accepted by method-specific options. */
export type JsonObject = Record<string, unknown>;

/** Input formats understood by plot input parsing. */
export type InputFormat = 'json' | 'csv' | 'tsv' | 'space';

/** Process stream used for chart output. */
export type PlotOutputTarget = 'stdout' | 'stderr';

/** CLI values that map directly to simple-ascii-chart plot settings. */
export type CliSettingsInput = {
  options?: string;
  title?: string;
  xLabel?: string;
  yLabel?: string;
  width?: number | string;
  height?: number;
  aspectRatio?: number;
  fillArea?: boolean;
  hideYAxis?: boolean;
  hideXAxis?: boolean;
  color?: (string | number)[] | string;
  axisCenter?: (string | number)[];
  yRange?: (string | number)[];
  showTickLabel?: boolean;
  hideXAxisTicks?: boolean;
  hideYAxisTicks?: boolean;
  customXAxisTicks?: (string | number)[];
  customYAxisTicks?: (string | number)[];
  titleColor?: string;
  borderColor?: string;
  backgroundColor?: string;
  overflow?: Overflow;
  renderer?: Renderer;
  interpolation?: Interpolation;
  coloring?: string;
  barLayout?: BarLayout;
  valueLabels?: string;
  xAxis?: string;
  yAxis?: string;
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

/** Fully parsed command-line arguments. */
export type CliArguments = CliSettingsInput & {
  method?: ApiMethod;
  input?: string;
  inputFile?: string;
  format?: InputFormat;
  delimiter?: string;
  header?: boolean;
  xCol?: string;
  yCol?: string;
  stream?: boolean;
  window?: number;
  refreshMs?: number;
  rate?: boolean;
  series?: number;
  passthrough?: boolean;
  plotOutput?: PlotOutputTarget;
  verbose?: boolean;
};

/** Parsed sample emitted by streaming input. */
export type ParsedStreamSample = {
  x: number;
  values: number[];
  sampleMs: number;
  nextAutoX: number;
};

/** Configuration required to render streaming input. */
export type StreamExecutionOptions = {
  options?: Settings;
  plotOutput: PlotOutputTarget;
  refreshMs: number;
  seriesCount: number;
  rateEnabled: boolean;
  window: number;
  passthrough: boolean;
};
