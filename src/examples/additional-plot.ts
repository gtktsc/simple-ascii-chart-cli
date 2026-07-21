import type { CliExample, PlotScenario } from './types';

const renderers = ['ascii', 'braille'] as const;

const multiSeries = [
  [
    [0, 3],
    [1, 5],
    [2, 4],
    [3, 7],
    [4, 6],
  ],
  [
    [0, 2],
    [1, 4],
    [2, 6],
    [3, 3],
    [4, 5],
  ],
  [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 3],
  ],
];

const scenarios: readonly PlotScenario[] = [
  {
    title: 'dataset sine approximation',
    input: [
      [0, 0],
      [1, 0.84],
      [2, 0.91],
      [3, 0.14],
      [4, -0.76],
      [5, -0.96],
    ],
  },
  {
    title: 'dataset sawtooth cycle',
    input: [
      [0, 0],
      [1, 2],
      [2, 4],
      [3, 0],
      [4, 2],
      [5, 4],
      [6, 0],
    ],
  },
  {
    title: 'dataset alternating extremes',
    input: [
      [0, -10],
      [1, 10],
      [2, -10],
      [3, 10],
      [4, -10],
    ],
  },
  {
    title: 'dataset exponential growth',
    input: [
      [0, 1],
      [1, 2],
      [2, 4],
      [3, 8],
      [4, 16],
      [5, 32],
    ],
  },
  {
    title: 'dataset diminishing growth',
    input: [
      [0, 0],
      [1, 10],
      [2, 15],
      [3, 18],
      [4, 20],
      [5, 21],
    ],
  },
  {
    title: 'dataset micro values',
    input: [
      [0, 0.000_001],
      [1, 0.000_004],
      [2, 0.000_002],
      [3, 0.000_007],
    ],
  },
  {
    title: 'dataset million scale',
    input: [
      [0, 1_000_000],
      [1, 4_000_000],
      [2, 2_500_000],
      [3, 7_000_000],
    ],
  },
  {
    title: 'dataset isolated spike',
    input: [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 100],
      [4, 0],
      [5, 0],
      [6, 0],
    ],
  },
  {
    title: 'dataset plateau then drop',
    input: [
      [0, 8],
      [1, 8],
      [2, 8],
      [3, 8],
      [4, 2],
      [5, 2],
    ],
  },
  {
    title: 'dataset irregular negative intervals',
    input: [
      [-10, -2],
      [-4, -8],
      [1, -3],
      [9, -7],
      [20, -1],
    ],
  },
  {
    title: 'dataset internal null run',
    input: [
      [0, 2],
      [1, null],
      [2, null],
      [3, 6],
      [4, 3],
    ],
  },
  { title: 'dataset three series', input: multiSeries },
  {
    title: 'option grouped three-series bars',
    input: multiSeries,
    options: ['--mode', 'bar', '--bar-layout', 'grouped'],
  },
  {
    title: 'option stacked three-series bars',
    input: multiSeries,
    options: ['--mode', 'bar', '--bar-layout', 'stacked'],
  },
  {
    title: 'option normalized three-series bars',
    input: multiSeries,
    options: ['--mode', 'bar', '--bar-layout', 'normalized'],
  },
  {
    title: 'option grouped horizontal bars',
    input: [
      [
        [3, 0],
        [5, 1],
        [4, 2],
      ],
      [
        [2, 0],
        [4, 1],
        [6, 2],
      ],
    ],
    options: ['--mode', 'horizontalBar', '--bar-layout', 'grouped'],
  },
  {
    title: 'option linear interpolation',
    input: [
      [0, 1],
      [1, 8],
      [2, 3],
      [3, 9],
      [4, 2],
    ],
    options: ['--interpolation', 'linear'],
  },
  {
    title: 'option clipped x domain',
    input: [
      [0, 1],
      [1, 4],
      [2, 2],
      [3, 7],
      [4, 3],
    ],
    options: ['--overflow', 'clip', '--x-axis', '{"domain":[1,3]}'],
  },
  {
    title: 'option discarded x domain',
    input: [
      [0, 1],
      [1, 4],
      [2, 2],
      [3, 7],
      [4, 3],
    ],
    options: ['--overflow', 'discard', '--x-axis', '{"domain":[1,3]}'],
  },
  {
    title: 'option colored threshold',
    input: [
      [0, 25],
      [1, 55],
      [2, 72],
      [3, 48],
      [4, 91],
    ],
    options: ['--thresholds', '{"y":75,"label":"alert","color":"ansiBrightRed"}'],
  },
  {
    title: 'option multiple thresholds',
    input: [
      [0, 20],
      [1, 45],
      [2, 65],
      [3, 85],
    ],
    options: [
      '--thresholds',
      '[{"y":30,"label":"warn","color":"ansiYellow"},{"y":70,"label":"critical","color":"ansiRed"}]',
    ],
  },
  {
    title: 'option multiple highlighted points',
    input: [
      [0, 2],
      [1, 5],
      [2, 3],
      [3, 8],
      [4, 4],
    ],
    options: [
      '--points',
      '[{"x":1,"y":6,"label":"first","color":"ansiCyan"},{"x":3,"y":9,"label":"second","color":"ansiMagenta"}]',
    ],
  },
  {
    title: 'option bar value labels',
    input: [
      [0, 3],
      [1, 7],
      [2, 5],
      [3, 9],
    ],
    options: ['--mode', 'bar', '--value-labels', 'true'],
  },
  {
    title: 'option bright title and border',
    input: [
      [0, 2],
      [1, 6],
      [2, 4],
      [3, 8],
    ],
    options: [
      '--title',
      'Colored frame',
      '--title-color',
      'ansiBrightCyan',
      '--border-color',
      'ansiBrightBlue',
    ],
  },
  {
    title: 'option percentage formatter',
    input: [
      [0, 0.1],
      [1, 0.4],
      [2, 0.25],
      [3, 0.8],
    ],
    options: ['--formatter', '(value) => Math.round(value * 100) + "%"'],
  },
];

/** Additional snapshot-backed plot examples using new datasets and option combinations. */
export const additionalPlotExamples: readonly CliExample[] = scenarios.flatMap(
  ({ title, input, options = [] }) =>
    renderers.map((renderer) => ({
      group: 'plot' as const,
      title: `${title} [${renderer}]`,
      renderer,
      args: [
        '--method',
        'plot',
        '--input',
        JSON.stringify(input),
        '--width',
        '36',
        '--height',
        '9',
        '--renderer',
        renderer,
        ...options,
      ],
    })),
);
