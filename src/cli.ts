#!/usr/bin/env node

// Import necessary modules and types
import * as yargs from 'yargs';
import plot from 'simple-ascii-chart';
import { MultiLine, Settings } from 'simple-ascii-chart';
import {
  validateFormatter,
  validateLineFormatter,
  validateSymbols,
  validateAxisCenter,
  validateColors,
  validateLegend,
  validateThresholds,
  validateYRange,
} from './validators';

// Define command-line arguments with yargs
const { argv } = yargs
  .option('input', {
    alias: 'i',
    type: 'string',
    demandOption: true,
    description: 'Data to be plotted (in JSON format)',
  })
  .option('options', {
    alias: 'o',
    type: 'string',
    description: 'Plot settings (in JSON format)',
  })
  .option('height', {
    alias: 'h',
    type: 'number',
    description: 'Height of the plot',
  })
  .option('hideXAxis', {
    type: 'boolean',
    description: 'Hide the x-axis if set to true',
  })
  .option('barChart', {
    type: 'boolean',
    description: 'Draw bar chart if set to true',
  })
  .option('horizontalBarChart', {
    type: 'boolean',
    description: 'Draw horizontal bar chart if set to true',
  })
  .option('hideYAxis', {
    type: 'boolean',
    description: 'Hide the y-axis if set to true',
  })
  .option('fillArea', {
    type: 'boolean',
    description: 'Fill the plot area if set to true',
  })
  .option('width', {
    alias: 'w',
    type: 'number',
    description: 'Width of the plot',
  })
  .option('title', {
    alias: 't',
    type: 'string',
    description: 'Title for the plot',
  })
  .option('xLabel', {
    type: 'string',
    description: 'Label for the x-axis',
  })
  .option('yLabel', {
    type: 'string',
    description: 'Label for the y-axis',
  })
  .option('color', {
    alias: 'c',
    type: 'array',
    description: 'Array of colors for plot elements',
  })
  .option('axisCenter', {
    type: 'array',
    description: 'Center coordinates for axis alignment',
  })
  .option('yRange', {
    type: 'array',
    description: 'Range for the y-axis, formatted as [min, max]',
  })
  .option('showTickLabel', {
    type: 'boolean',
    description: 'Show tick labels on the axis if set to true',
  })
  .option('thresholds', {
    type: 'array',
    description: 'Array of threshold points or lines with optional color',
  })
  .option('legend', {
    type: 'string',
    description: 'Legend settings (position and series labels)',
  })
  .option('formatter', {
    type: 'string',
    description: 'Custom formatter for axis values, as a JavaScript function',
  })
  .option('lineFormatter', {
    type: 'string',
    description: 'Formatter for customizing line appearance, as a JavaScript function',
  })
  .option('symbols', {
    type: 'string',
    description: 'Custom symbols for axis, chart, and background',
  });

// Helper function to execute code with error handling
const withError = (cb: () => unknown) => {
  try {
    cb();
  } catch (error) {
    // Display an error message and exit the process with a failure code
    process.stderr.write('Oops! Something went wrong!\n');
    process.exit(1);
  }
};

// Main function to execute the plot based on input and options
const execute = ({ input, options }: { input: MultiLine; options?: Settings }) => {
  withError(() => {
    // Generate the ASCII plot based on provided input and settings
    const output = plot(input, options);
    // Output the result to the console
    process.stdout.write(output);
    process.exit(0); // Exit successfully after outputting the plot
  });
};

const prepareParams = ({
  input,
  options,
  width,
  height,
  hideYAxis,
  hideXAxis,
  fillArea,
  title,
  xLabel,
  yLabel,
  color,
  axisCenter,
  yRange,
  showTickLabel,
  thresholds,
  legend,
  formatter,
  lineFormatter,
  symbols,
  barChart,
  horizontalBarChart,
}: {
  input: string;
  options?: string;
  title?: string;
  xLabel?: string;
  yLabel?: string;
  width?: number;
  height?: number;
  fillArea?: boolean;
  hideYAxis?: boolean;
  hideXAxis?: boolean;
  color?: (string | number)[] | string;
  axisCenter?: (string | number)[];
  yRange?: (string | number)[];
  showTickLabel?: boolean;
  thresholds?: (string | number)[];
  legend?: string;
  formatter?: string;
  lineFormatter?: string;
  symbols?: string;
  barChart?: boolean;
  horizontalBarChart?: boolean;
}) => {
  const currentOptions = options ? JSON.parse(options) : {};

  return {
    input: JSON.parse(input) as MultiLine,
    options: {
      ...currentOptions,
      width,
      height,
      hideYAxis,
      hideXAxis,
      title,
      xLabel,
      yLabel,
      fillArea,
      barChart,
      horizontalBarChart,
      color: color ? validateColors(color) : undefined, // Ensure color matches Colors type
      axisCenter: validateAxisCenter(axisCenter), // Validate and format axisCenter
      yRange: validateYRange(yRange), // Validate and format yRange
      showTickLabel,
      thresholds: validateThresholds(thresholds), // Validate and format thresholds
      legend: validateLegend(legend), // Validate and format legend
      formatter: validateFormatter(formatter), // Parse formatter as a function
      lineFormatter: validateLineFormatter(lineFormatter), // Parse lineFormatter as a function
      symbols: validateSymbols(symbols), // Parse and format symbols
    },
  };
};

// Check if argv is a Promise to handle async parsing in yargs
if (argv instanceof Promise) {
  // If async, wait for arguments and execute the plotting
  argv.then((parameters) => {
    withError(() => {
      execute(prepareParams(parameters));
    });
  });
} else {
  // Synchronously prepare parameters and execute the plot
  withError(() => {
    execute(prepareParams(argv));
  });
}
