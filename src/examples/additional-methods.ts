import type { CliExample, MethodScenario } from './types';

const methodArgs = (method: string, input: unknown, options?: unknown): readonly string[] => [
  '--method',
  method,
  '--input',
  JSON.stringify(input),
  ...(options === undefined ? [] : ['--options', JSON.stringify(options)]),
];

const createExamples = (
  group: CliExample['group'],
  scenarios: readonly MethodScenario[],
): CliExample[] =>
  scenarios.map(({ title, input, options }) => ({
    group,
    title,
    args: methodArgs(group, input, options),
  }));

const sparklineExamples = createExamples('sparkline', [
  { title: 'telemetry short pulse', input: [0, 5, 0] },
  { title: 'telemetry staircase', input: [1, 1, 2, 2, 3, 3, 4, 4] },
  { title: 'telemetry symmetric mountain', input: [0, 2, 5, 8, 5, 2, 0] },
  { title: 'telemetry signed oscillation', input: [-6, 4, -2, 8, -4, 6] },
  {
    title: 'telemetry visible missing samples',
    input: [2, null, null, 8, null, 4],
    options: { symbols: { empty: '·' } },
  },
  {
    title: 'telemetry bright blue',
    input: [2, 6, 3, 9, 5, 11],
    options: { color: 'ansiBrightBlue' },
  },
  {
    title: 'telemetry magenta decay',
    input: [100, 70, 50, 35, 20, 10],
    options: { color: 'ansiMagenta' },
  },
  {
    title: 'telemetry six-color palette',
    input: [1, 6, 3, 8, 2, 9],
    options: {
      color: ['ansiRed', 'ansiYellow', 'ansiGreen', 'ansiCyan', 'ansiBlue', 'ansiMagenta'],
    },
  },
  {
    title: 'telemetry zero threshold',
    input: [-5, -1, 0, 2, -3, 6],
    options: {
      threshold: { value: 0, belowColor: 'ansiRed', aboveColor: 'ansiGreen' },
    },
  },
  {
    title: 'telemetry custom level glyphs',
    input: [0, 1, 2, 3, 4, 5, 6, 7],
    options: { symbols: { levels: ['.', ':', '-', '=', '+', '*', '#', '@'] } },
  },
  {
    title: 'telemetry sixteen samples',
    input: [3, 7, 4, 9, 6, 12, 8, 5, 11, 14, 9, 13, 10, 16, 12, 15],
  },
  { title: 'telemetry tiny decimal range', input: [0.0001, 0.00015, 0.00011, 0.0002] },
]);

const histogramExamples = createExamples('histogram', [
  { title: 'distribution bimodal', input: [1, 1, 2, 2, 8, 8, 9, 9], options: { binCount: 5 } },
  {
    title: 'distribution positive skew',
    input: [1, 1, 1, 2, 2, 3, 5, 13],
    options: { binCount: 6 },
  },
  {
    title: 'distribution negative skew',
    input: [-13, -5, -3, -2, -2, -1, -1, -1],
    options: { binCount: 6 },
  },
  {
    title: 'distribution centered decimals',
    input: [-0.5, -0.25, 0, 0.25, 0.5],
    options: { binCount: 5 },
  },
  {
    title: 'distribution milliseconds',
    input: [12, 18, 21, 24, 29, 31, 35, 42],
    options: { binCount: 4 },
  },
  {
    title: 'distribution response sizes',
    input: [128, 256, 256, 512, 1024, 1024, 2048],
    options: { binCount: 6 },
  },
  {
    title: 'distribution temperature',
    input: [-12, -8, -3, 0, 4, 9, 15],
    options: { binCount: 7 },
  },
  {
    title: 'distribution narrow cluster',
    input: [9.8, 9.9, 10, 10.1, 10.2],
    options: { binCount: 4 },
  },
  { title: 'distribution sparse outliers', input: [-100, -1, 0, 1, 100], options: { binCount: 8 } },
  {
    title: 'distribution duplicate quartiles',
    input: [25, 25, 50, 50, 75, 75, 100],
    options: { binCount: 4 },
  },
  { title: 'distribution single negative value', input: [-42], options: { binCount: 3 } },
  {
    title: 'distribution powers of ten',
    input: [1, 10, 100, 1000, 10_000],
    options: { binCount: 5 },
  },
]);

const numericLevels = [
  { value: 0, symbol: '·', label: 'clear' },
  { value: 1, symbol: '▒', label: 'watch' },
  { value: 2, symbol: '█', label: 'alert' },
];

const statusLevels = [
  { value: 'pass', symbol: '✓', label: 'passing', color: 'ansiGreen' },
  { value: 'warn', symbol: '!', label: 'warning', color: 'ansiYellow' },
  { value: 'fail', symbol: '×', label: 'failed', color: 'ansiRed' },
];

const heatmapExamples = createExamples('heatmap', [
  {
    title: 'matrix diagonal alerts',
    input: [
      [2, 0, 0],
      [0, 2, 0],
      [0, 0, 2],
    ],
    options: {
      rows: ['api', 'db', 'queue'],
      columns: ['cpu', 'ram', 'disk'],
      levels: numericLevels,
    },
  },
  {
    title: 'matrix deployment wave',
    input: [
      [1, 2, 0],
      [0, 1, 2],
      [2, 0, 1],
    ],
    options: {
      title: 'Deployments',
      rows: ['eu', 'us', 'apac'],
      columns: ['canary', 'half', 'full'],
      levels: numericLevels,
      legend: true,
    },
  },
  {
    title: 'matrix service checks',
    input: [
      ['pass', 'pass', 'warn'],
      ['pass', 'fail', 'warn'],
    ],
    options: {
      rows: ['frontend', 'worker'],
      columns: ['unit', 'integration', 'e2e'],
      levels: statusLevels,
      legend: true,
    },
  },
  {
    title: 'matrix weekly incidents',
    input: [
      [0, 1, 0, 2, 1],
      [1, 0, 2, 0, 0],
    ],
    options: {
      rows: ['week 1', 'week 2'],
      columns: ['mon', 'tue', 'wed', 'thu', 'fri'],
      levels: numericLevels,
    },
  },
  {
    title: 'matrix sparse measurements',
    input: [
      [0, null, 2, null],
      [null, 1, null, 0],
    ],
    options: {
      rows: ['primary', 'replica'],
      columns: ['00', '06', '12', '18'],
      levels: numericLevels,
    },
  },
  {
    title: 'matrix permissions',
    input: [
      [2, 2, 2],
      [2, 1, 0],
      [1, 0, 0],
    ],
    options: {
      rows: ['admin', 'editor', 'viewer'],
      columns: ['read', 'write', 'delete'],
      levels: numericLevels,
      legend: true,
    },
  },
  {
    title: 'matrix cache tiers',
    input: [
      [2, 1, 0, 1],
      [1, 2, 1, 0],
      [0, 1, 2, 1],
    ],
    options: {
      title: 'Cache heat',
      rows: ['edge', 'regional', 'origin'],
      columns: ['a', 'b', 'c', 'd'],
      levels: numericLevels,
    },
  },
  {
    title: 'matrix release readiness',
    input: [
      ['pass', 'warn'],
      ['pass', 'pass'],
      ['fail', 'warn'],
    ],
    options: {
      rows: ['linux', 'macos', 'windows'],
      columns: ['x64', 'arm64'],
      levels: statusLevels,
      legend: true,
    },
  },
  {
    title: 'matrix unlabeled five by two',
    input: [
      [0, 1, 2, 1, 0],
      [2, 1, 0, 1, 2],
    ],
    options: { levels: numericLevels },
  },
  {
    title: 'matrix custom hash cells',
    input: [
      [0, 1, 2],
      [2, 1, 0],
    ],
    options: { levels: numericLevels, symbols: { cell: '#' } },
  },
  {
    title: 'matrix localized labels',
    input: [
      [0, 1, 2],
      [2, 1, 0],
    ],
    options: {
      title: '状態',
      rows: ['東京', '大阪'],
      columns: ['朝', '昼', '夜'],
      levels: numericLevels,
    },
  },
  {
    title: 'matrix all warning',
    input: [
      [1, 1, 1],
      [1, 1, 1],
    ],
    options: {
      rows: ['alpha', 'beta'],
      columns: ['one', 'two', 'three'],
      levels: numericLevels,
      legend: true,
    },
  },
]);

const candlestickExamples = createExamples('candlestick', [
  {
    title: 'market bullish week',
    input: [
      [1, 10, 14, 9, 13],
      [2, 13, 17, 12, 16],
      [3, 16, 20, 15, 19],
    ],
    options: { title: 'Bullish week', width: 30, height: 9 },
  },
  {
    title: 'market bearish week',
    input: [
      [1, 20, 21, 16, 17],
      [2, 17, 18, 13, 14],
      [3, 14, 15, 10, 11],
    ],
    options: { title: 'Bearish week', width: 30, height: 9 },
  },
  {
    title: 'market volatile session',
    input: [
      [1, 10, 25, 5, 20],
      [2, 20, 28, 8, 12],
      [3, 12, 30, 6, 26],
    ],
    options: { width: 32, height: 10 },
  },
  {
    title: 'market narrow range',
    input: [
      [1, 10, 11, 9, 10.5],
      [2, 10.5, 11.2, 10, 10.8],
      [3, 10.8, 11, 10.2, 10.4],
    ],
    options: { width: 32, height: 8 },
  },
  {
    title: 'market gap up',
    input: [
      [1, 10, 13, 9, 12],
      [2, 18, 22, 17, 21],
      [3, 21, 24, 19, 20],
    ],
    options: { width: 30, height: 9 },
  },
  {
    title: 'market gap down',
    input: [
      [1, 24, 26, 22, 25],
      [2, 16, 18, 13, 14],
      [3, 14, 17, 12, 16],
    ],
    options: { width: 30, height: 9 },
  },
  {
    title: 'market crossing zero',
    input: [
      [1, -3, 2, -5, 1],
      [2, 1, 4, -2, -1],
      [3, -1, 3, -4, 2],
    ],
    options: { width: 30, height: 9 },
  },
  {
    title: 'market micro prices',
    input: [
      [1, 0.01, 0.016, 0.008, 0.014],
      [2, 0.014, 0.02, 0.012, 0.018],
    ],
    options: { width: 26, height: 8 },
  },
  {
    title: 'market large prices',
    input: [
      [1, 10_000, 14_000, 9_000, 13_000],
      [2, 13_000, 18_000, 12_000, 17_000],
    ],
    options: { width: 30, height: 8 },
  },
  {
    title: 'market explicit y domain',
    input: [
      [1, 40, 55, 35, 50],
      [2, 50, 65, 45, 60],
    ],
    options: { width: 28, height: 9, yAxis: { domain: [0, 100] } },
  },
  {
    title: 'market support threshold',
    input: [
      [1, 48, 55, 45, 52],
      [2, 52, 60, 49, 58],
      [3, 58, 62, 50, 53],
    ],
    options: {
      width: 30,
      height: 9,
      thresholds: [{ id: 'support', y: 50, label: 'support', color: 'ansiYellow' }],
    },
  },
  {
    title: 'market bright palette',
    input: [
      [1, 8, 12, 7, 11],
      [2, 11, 13, 9, 10],
      [3, 10, 15, 9, 14],
    ],
    options: {
      width: 30,
      height: 9,
      risingColor: 'ansiBrightGreen',
      fallingColor: 'ansiBrightRed',
    },
  },
]);

const renderChartScenarios = [
  {
    title: 'additional sparse line',
    series: [
      {
        id: 'requests',
        data: [
          [0, 2],
          [1, null],
          [2, 7],
          [3, 4],
          [4, 9],
        ],
      },
    ],
  },
  {
    title: 'additional three lines',
    series: [
      {
        id: 'api',
        name: 'API',
        data: [
          [0, 2],
          [1, 6],
          [2, 4],
          [3, 8],
        ],
      },
      {
        id: 'worker',
        name: 'Worker',
        data: [
          [0, 5],
          [1, 3],
          [2, 7],
          [3, 4],
        ],
      },
      {
        id: 'queue',
        name: 'Queue',
        data: [
          [0, 1],
          [1, 4],
          [2, 2],
          [3, 6],
        ],
      },
    ],
  },
  {
    title: 'additional alert points',
    series: [
      {
        id: 'alerts',
        mode: 'point',
        data: [
          [0, 1],
          [1, 5],
          [2, 2],
          [3, 8],
          [4, 3],
        ],
      },
    ],
  },
  {
    title: 'additional grouped categories',
    xAxis: { scale: 'band' },
    barLayout: 'grouped',
    series: [
      {
        id: 'current',
        name: 'Current',
        mode: 'bar',
        data: [
          ['Jan', 4],
          ['Feb', 7],
          ['Mar', 5],
        ],
      },
      {
        id: 'previous',
        name: 'Previous',
        mode: 'bar',
        data: [
          ['Jan', 3],
          ['Feb', 5],
          ['Mar', 6],
        ],
      },
    ],
  },
  {
    title: 'additional mixed signs',
    yAxis: { domain: [-10, 10] },
    series: [
      {
        id: 'balance',
        data: [
          [0, -8],
          [1, 4],
          [2, -2],
          [3, 9],
          [4, -5],
        ],
      },
    ],
  },
  {
    title: 'additional filled trend',
    series: [
      {
        id: 'capacity',
        fillArea: true,
        data: [
          [0, 1],
          [1, 4],
          [2, 7],
          [3, 5],
          [4, 9],
        ],
      },
    ],
  },
] as const;

const renderChartExamples: readonly CliExample[] = renderChartScenarios.flatMap((scenario) =>
  (['ascii', 'braille'] as const).map((renderer) => ({
    group: 'render-chart' as const,
    title: `${scenario.title} [${renderer}]`,
    renderer,
    args: methodArgs('renderChart', {
      ...scenario,
      width: 38,
      height: 10,
      renderer,
      legend: { position: 'bottom', series: true },
    }),
  })),
);

/** Additional snapshot-backed examples for every non-plot CLI method. */
export const additionalMethodExamples: readonly CliExample[] = [
  ...renderChartExamples,
  ...candlestickExamples,
  ...heatmapExamples,
  ...sparklineExamples,
  ...histogramExamples,
];
