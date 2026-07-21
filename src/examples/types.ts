/** Public CLI method folders represented by usage snapshots. */
export type CliExampleGroup =
  | 'candlestick'
  | 'heatmap'
  | 'histogram'
  | 'plot'
  | 'render-chart'
  | 'sparkline';

/** One executable CLI usage example and its snapshot metadata. */
export type CliExample = Readonly<{
  group: CliExampleGroup;
  title: string;
  args: readonly string[];
  stdin?: string;
  renderer?: 'ascii' | 'braille';
}>;

/** Captured process result used by snapshot formatting. */
export type CliResult = Readonly<{
  code: number | null;
  stdout: string;
  stderr: string;
}>;

/** Plot input and option tokens used to build renderer-paired examples. */
export type PlotScenario = Readonly<{
  title: string;
  input: unknown;
  options?: readonly string[];
}>;

/** Method input and options used to build non-plot CLI examples. */
export type MethodScenario = Readonly<{
  title: string;
  input: unknown;
  options?: unknown;
}>;
