import type { CliExample } from './types';

const methodArgs = (method: string, input: unknown, options?: unknown): readonly string[] => [
  '--method',
  method,
  '--input',
  JSON.stringify(input),
  ...(options === undefined ? [] : ['--options', JSON.stringify(options)]),
];

const createExamples = (
  group: CliExample['group'],
  scenarios: readonly Readonly<{ title: string; input: unknown; options?: unknown }>[],
): CliExample[] =>
  scenarios.map(({ title, input, options }) => ({
    group,
    title,
    args: methodArgs(group === 'render-chart' ? 'renderChart' : group, input, options),
  }));

/** Snapshot-backed sparkline CLI examples. */
export const sparklineExamples: readonly CliExample[] = createExamples('sparkline', [
  { title: 'ascending', input: [0, 1, 2, 3, 4, 5, 6, 7] },
  { title: 'descending', input: [7, 6, 5, 4, 3, 2, 1, 0] },
  { title: 'mixed signs', input: [-8, -3, 0, 4, 9] },
  { title: 'missing values', input: [1, null, 3, null, 2, 5] },
  { title: 'flat values', input: [5, 5, 5, 5] },
  { title: 'single value', input: [42] },
  { title: 'decimal values', input: [0.1, 0.15, 0.13, 0.2, 0.24, 0.3] },
  { title: 'large range', input: [10, 1000, 50, 800, 120] },
  { title: 'green color', input: [1, 4, 2, 8, 5], options: { color: 'ansiGreen' } },
  {
    title: 'custom symbols',
    input: [0, null, 7],
    options: { symbols: { empty: '.', levels: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] } },
  },
  {
    title: 'per-value colors',
    input: [1, 3, 2, 5],
    options: { color: ['ansiRed', 'ansiYellow', 'ansiCyan', 'ansiGreen'] },
  },
  {
    title: 'threshold colors',
    input: [1, 4, 2, 8, 3, 9],
    options: { threshold: { value: 5, belowColor: 'ansiGreen', aboveColor: 'ansiRed' } },
  },
]);

/** Snapshot-backed histogram CLI examples. */
export const histogramExamples: readonly CliExample[] = createExamples('histogram', [
  { title: 'default bins', input: [0, 1, 2, 3, 4, 5, 6, 7] },
  { title: 'four bins', input: [0, 1, 2, 3, 4], options: { binCount: 4 } },
  { title: 'two bins', input: [1, 2, 3, 4, 5, 6], options: { binCount: 2 } },
  { title: 'three bins', input: [1, 1, 2, 2, 2, 4], options: { binCount: 3 } },
  { title: 'repeated value', input: [4, 4, 4, 4], options: { binCount: 8 } },
  { title: 'negative values', input: [-8, -5, -3, -1], options: { binCount: 4 } },
  { title: 'mixed signs', input: [-5, -1, 0, 2, 8], options: { binCount: 5 } },
  { title: 'decimal values', input: [0.1, 0.2, 0.25, 0.8, 0.9], options: { binCount: 4 } },
  { title: 'outlier', input: [1, 1, 2, 2, 3, 100], options: { binCount: 5 } },
  { title: 'dense samples', input: [1, 1, 1, 2, 2, 3, 3, 3, 3, 4], options: { binCount: 4 } },
  { title: 'wide range', input: [-1000, -100, 0, 100, 1000], options: { binCount: 5 } },
  { title: 'fractional range', input: [-0.01, 0, 0.01, 0.02], options: { binCount: 3 } },
]);

const heatmapLevels = [
  { value: 0, symbol: '·', label: 'none' },
  { value: 1, symbol: '░', label: 'low' },
  { value: 2, symbol: '▓', label: 'high' },
];

/** Snapshot-backed heatmap CLI examples. */
export const heatmapExamples: readonly CliExample[] = createExamples('heatmap', [
  { title: 'single cell', input: [[1]], options: { levels: heatmapLevels } },
  {
    title: 'single row',
    input: [[0, 1, 2]],
    options: { columns: ['a', 'b', 'c'], levels: heatmapLevels },
  },
  {
    title: 'single column',
    input: [[0], [1], [2]],
    options: { rows: ['a', 'b', 'c'], levels: heatmapLevels },
  },
  {
    title: 'checkerboard',
    input: [
      [0, 2],
      [2, 0],
    ],
    options: { rows: ['api', 'db'], columns: ['now', 'next'], levels: heatmapLevels },
  },
  {
    title: 'with legend',
    input: [[0, 1, 2]],
    options: { title: 'Load', levels: heatmapLevels, legend: true },
  },
  {
    title: 'with null cells',
    input: [
      [0, null, 2],
      [null, 1, null],
    ],
    options: { levels: heatmapLevels },
  },
  {
    title: 'unicode labels',
    input: [[1, 2]],
    options: { title: '世界', rows: ['東京'], columns: ['東', '西'], levels: heatmapLevels },
  },
  {
    title: 'long labels',
    input: [
      [0, 1],
      [2, 1],
    ],
    options: {
      rows: ['background worker', 'public api'],
      columns: ['north america', 'europe'],
      levels: heatmapLevels,
    },
  },
  {
    title: 'custom cell symbol',
    input: [[0, 1, 2]],
    options: { levels: heatmapLevels, symbols: { cell: '#' } },
  },
  {
    title: 'colored levels',
    input: [[0, 1, 2]],
    options: {
      levels: [
        { value: 0, color: 'ansiGreen' },
        { value: 1, color: 'ansiYellow' },
        { value: 2, color: 'ansiRed' },
      ],
      legend: true,
    },
  },
]);

const candleData = [
  [1, 10, 14, 8, 13],
  [2, 13, 15, 11, 12],
  [3, 12, 16, 10, 15],
];

/** Snapshot-backed candlestick CLI examples. */
export const candlestickExamples: readonly CliExample[] = createExamples('candlestick', [
  { title: 'basic market', input: candleData, options: { width: 28, height: 8 } },
  { title: 'titled market', input: candleData, options: { title: 'OHLC', width: 28, height: 8 } },
  { title: 'single rising candle', input: [[1, 5, 8, 4, 7]], options: { width: 18, height: 7 } },
  { title: 'single falling candle', input: [[1, 7, 8, 4, 5]], options: { width: 18, height: 7 } },
  { title: 'unchanged candle', input: [[1, 5, 7, 3, 5]], options: { width: 18, height: 7 } },
  {
    title: 'negative prices',
    input: [
      [1, -5, -2, -8, -3],
      [2, -3, -1, -6, -5],
    ],
    options: { width: 24, height: 8 },
  },
  {
    title: 'decimal prices',
    input: [
      [1, 1.2, 1.8, 0.9, 1.6],
      [2, 1.6, 2.1, 1.3, 1.4],
    ],
    options: { width: 24, height: 8 },
  },
  {
    title: 'hidden axes',
    input: candleData,
    options: { width: 28, height: 8, xAxis: { visible: false }, yAxis: { visible: false } },
  },
  {
    title: 'custom colors',
    input: candleData,
    options: { width: 28, height: 8, risingColor: 'ansiGreen', fallingColor: 'ansiRed' },
  },
  {
    title: 'four candles',
    input: [...candleData, [4, 15, 17, 13, 14]],
    options: { width: 32, height: 9 },
  },
]);

const renderChartScenarios = [
  {
    title: 'single line',
    series: [
      {
        id: 'cpu',
        data: [
          [0, 2],
          [1, 5],
          [2, 3],
          [3, 7],
        ],
      },
    ],
  },
  {
    title: 'two lines',
    series: [
      {
        id: 'api',
        data: [
          [0, 2],
          [1, 5],
          [2, 3],
        ],
      },
      {
        id: 'db',
        data: [
          [0, 4],
          [1, 2],
          [2, 6],
        ],
      },
    ],
  },
  {
    title: 'points',
    series: [
      {
        id: 'events',
        mode: 'point',
        data: [
          [0, 2],
          [1, 5],
          [2, 3],
        ],
      },
    ],
  },
  {
    title: 'bars',
    series: [
      {
        id: 'sales',
        mode: 'bar',
        data: [
          [0, 2],
          [1, 5],
          [2, 3],
        ],
      },
    ],
  },
  {
    title: 'mixed bars and line',
    series: [
      {
        id: 'sales',
        mode: 'bar',
        data: [
          [0, 2],
          [1, 5],
          [2, 3],
        ],
      },
      {
        id: 'target',
        mode: 'line',
        data: [
          [0, 4],
          [1, 4],
          [2, 4],
        ],
      },
    ],
  },
] as const;

/** Snapshot-backed renderChart CLI examples. */
export const renderChartExamples: readonly CliExample[] = renderChartScenarios.flatMap(
  ({ title, series }) =>
    (['ascii', 'braille'] as const).map((renderer) => ({
      group: 'render-chart' as const,
      title: `${title} [${renderer}]`,
      renderer,
      args: methodArgs('renderChart', {
        title,
        width: 32,
        height: 8,
        renderer,
        legend: { position: 'bottom', series: true },
        series,
      }),
    })),
);
