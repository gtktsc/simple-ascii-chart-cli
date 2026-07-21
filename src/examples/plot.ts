import type { CliExample, PlotScenario } from './types';

const renderers = ['ascii', 'braille'] as const;
const standardInput = [
  [0, 2],
  [1, 5],
  [2, 3],
  [3, 7],
  [4, 4],
];
const mixedInput = [
  [-2, -4],
  [-1, 3],
  [0, -1],
  [1, 5],
  [2, -2],
];
const twoSeriesInput = [
  [
    [0, 2],
    [1, 4],
    [2, 3],
    [3, 6],
  ],
  [
    [0, 5],
    [1, 3],
    [2, 6],
    [3, 2],
  ],
];

const baseScenarios: readonly PlotScenario[] = [
  {
    title: 'ascending values',
    input: [
      [0, 1],
      [1, 2],
      [2, 4],
      [3, 7],
    ],
  },
  {
    title: 'descending values',
    input: [
      [0, 8],
      [1, 5],
      [2, 3],
      [3, 1],
    ],
  },
  { title: 'zigzag values', input: standardInput },
  { title: 'mixed positive and negative values', input: mixedInput },
  {
    title: 'flat values',
    input: [
      [0, 4],
      [1, 4],
      [2, 4],
      [3, 4],
    ],
  },
  {
    title: 'null gap',
    input: [
      [0, 1],
      [1, null],
      [2, 5],
      [3, 2],
    ],
  },
  {
    title: 'decimal values',
    input: [
      [0, 0.1],
      [1, 0.35],
      [2, 0.2],
      [3, 0.75],
    ],
  },
  {
    title: 'uneven x intervals',
    input: [
      [0, 1],
      [1, 4],
      [5, 2],
      [12, 6],
    ],
  },
  {
    title: 'all negative values',
    input: [
      [0, -8],
      [1, -3],
      [2, -6],
      [3, -1],
    ],
  },
  { title: 'two series', input: twoSeriesInput },
];

const optionScenarios: readonly PlotScenario[] = [
  { title: 'title option', input: standardInput, options: ['--title', 'Release trend'] },
  {
    title: 'axis label options',
    input: standardInput,
    options: ['--x-label', 'day', '--y-label', 'requests'],
  },
  {
    title: 'compact dimensions',
    input: standardInput,
    options: ['--width', '20', '--height', '5'],
  },
  { title: 'tall dimensions', input: standardInput, options: ['--width', '24', '--height', '12'] },
  { title: 'hidden x axis', input: standardInput, options: ['--hide-x-axis'] },
  { title: 'hidden y axis', input: standardInput, options: ['--hide-y-axis'] },
  { title: 'hidden x ticks', input: standardInput, options: ['--hide-x-axis-ticks'] },
  { title: 'hidden y ticks', input: standardInput, options: ['--hide-y-axis-ticks'] },
  { title: 'filled area', input: standardInput, options: ['--fill-area'] },
  { title: 'point mode', input: standardInput, options: ['--mode', 'point'] },
  { title: 'vertical bar mode', input: standardInput, options: ['--mode', 'bar'] },
  { title: 'horizontal bar mode', input: standardInput, options: ['--mode', 'horizontalBar'] },
  { title: 'explicit y range', input: standardInput, options: ['--y-range', '0', '10'] },
  { title: 'centered axes', input: mixedInput, options: ['--axis-center', '0', '0'] },
  {
    title: 'custom axis ticks',
    input: standardInput,
    options: ['--custom-x-axis-ticks', '0', '2', '4', '--custom-y-axis-ticks', '0', '4', '8'],
  },
  {
    title: 'two series colors',
    input: twoSeriesInput,
    options: ['--color', 'ansiCyan', 'ansiYellow'],
  },
  {
    title: 'threshold marker',
    input: standardInput,
    options: ['--thresholds', '{"y":4,"label":"target","color":"ansiRed"}'],
  },
  {
    title: 'point marker',
    input: standardInput,
    options: ['--points', '{"x":2,"y":6,"label":"peak","color":"ansiGreen"}'],
  },
  {
    title: 'bottom legend',
    input: twoSeriesInput,
    options: ['--legend', '{"position":"bottom","series":["api","worker"]}'],
  },
  { title: 'debug grid', input: standardInput, options: ['--debug-mode'] },
];

const createPlotExamples = (scenarios: readonly PlotScenario[]): CliExample[] =>
  scenarios.flatMap(({ title, input, options = [] }) =>
    renderers.map((renderer) => {
      const dimensions = [
        ...(options.includes('--width') ? [] : ['--width', '32']),
        ...(options.includes('--height') ? [] : ['--height', '8']),
      ];

      return {
        group: 'plot' as const,
        title: `${title} [${renderer}]`,
        renderer,
        args: [
          '--method',
          'plot',
          '--input',
          JSON.stringify(input),
          ...dimensions,
          '--renderer',
          renderer,
          ...options,
        ],
      };
    }),
  );

/** Snapshot-backed plot CLI examples. */
export const plotExamples: readonly CliExample[] = [
  ...createPlotExamples(baseScenarios),
  ...createPlotExamples(optionScenarios),
];
