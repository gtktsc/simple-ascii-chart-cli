
# Simple ASCII Chart

![NPM License](https://img.shields.io/npm/l/simple-ascii-chart-cli)
![NPM Version](https://img.shields.io/npm/v/simple-ascii-chart-cli)
![npm package minimized gzipped size (select exports)](https://img.shields.io/bundlejs/size/simple-ascii-chart-cli)
![Codecov](https://img.shields.io/codecov/c/github/gtktsc/simple-ascii-chart-cli)

**Simple ASCII Chart** is a TypeScript package for generating ASCII charts in your terminal. It supports multi-dimensional input data, multi-series, custom colors, and formatters to make your data visualization customizable and visually engaging.

[Interactive Demo](https://simple-ascii-chart.vercel.app/)

With color for multiple lines:

![Example chart](https://user-images.githubusercontent.com/17948218/183446543-9a88e655-d83b-40f4-b7af-ffd8540380d2.png)

With colored area:

![Views per iteration](https://user-images.githubusercontent.com/17948218/183447293-4feac74f-b3d1-4e26-a8c1-02d793d3e81b.png)

With axis positioning:

![Example chart with center position](https://user-images.githubusercontent.com/17948218/183447523-a0604d0c-eb22-451a-91c8-fb56eff039a7.png)

## Installation

Install globally:

```bash
npm install -g simple-ascii-chart-cli
```

Or add it as a project dependency:

```bash
yarn add simple-ascii-chart
```

Then use it in your project:

```typescript
import plot from 'simple-ascii-chart';

const graph = plot(input, settings);
console.log(graph);
```

## Playground

Try the interactive [playground](https://simple-ascii-chart.vercel.app/) to create and customize graphs online.

## API Endpoint

Generate charts programmatically by sending a POST request to the API endpoint with your input data:

```bash
curl -d input='[[1,2],[2,3],[3,4]]' -G https://simple-ascii-chart.vercel.app/api
```

Or as a URL parameter:

```bash
https://simple-ascii-chart.vercel.app/api?input=[[1,2],[2,3],[3,4]]&settings={"width":50}
```

## CLI Usage

Run the CLI by passing your data and desired options:

```bash
simple-ascii-chart-cli --input '[[1, 2], [2, 3], [3, 4]]' --title "Sample Chart"
```

### CLI Options

| Option          | Alias | Type     | Description                                                                                     |
|-----------------|-------|----------|-------------------------------------------------------------------------------------------------|
| `--input`       | `-i`  | string   | The data to be plotted (in JSON format). Required.                                              |
| `--options`     | `-o`  | string   | Additional plot settings (in JSON format).                                                      |
| `--width`       | `-w`  | number   | Width of the plot.                                                                              |
| `--height`      | `-h`  | number   | Height of the plot.                                                                             |
| `--title`       | `-t`  | string   | Title for the plot.                                                                             |
| `--xLabel`      |       | string   | Label for the x-axis.                                                                           |
| `--yLabel`      |       | string   | Label for the y-axis.                                                                           |
| `--color`       | `-c`  | array    | Colors for plot elements, specified as ANSI color names.                                        |
| `--axisCenter`  |       | array    | Coordinates for axis center alignment.                                                          |
| `--yRange`      |       | array    | Y-axis range in the format `[min, max]`.                                                        |
| `--showTickLabel`|      | boolean  | Show tick labels on the axis if set to true.                                                    |
| `--thresholds`  |       | array    | Array of threshold points or lines with optional color.                                      |
| `--legend`      |       | string   | Legend settings (position and series labels) in JSON format.                                    |
| `--formatter`   |       | string   | Custom formatter function for axis values, as a JavaScript function string.                     |
| `--lineFormatter`|      | string   | Function to customize line appearance, as a JavaScript function string.                         |
| `--symbols`     |       | string   | Custom symbols for axis, chart, and background elements, in JSON format.                        |
| `--fillArea`    |       | boolean  | Fills the plot area if set to true.                                                             |
| `--hideXAxis`   |       | boolean  | Hides the x-axis if set to true.                                                                |
| `--hideYAxis`   |       | boolean  | Hides the y-axis if set to true.                                                                |

## API Reference

### Input Data

The input data should be a two-dimensional array. For a single series, provide an array of `[x, y]` coordinates:

```typescript
const input = [
  [1, 1],
  [2, 4],
  [3, 8],
];
```

For multiple series, nest each series inside the main array:

```typescript
const input = [
  [
    [1, 1],
    [2, 4],
    [3, 8],
  ],
  [
    [1, 2],
    [2, 3],
    [3, 5],
  ],
];
```

### Settings

The plot appearance can be customized with the `settings` parameter, which accepts the following options:

- **`color`**: Array of colors for multiple series, or a single color for one series.
- **`width`**: Customizes plot width.
- **`height`**: Customizes plot height.
- **`axisCenter`**: Sets axis center, default is bottom-left.
- **`formatter`**: Formats axis labels. Accepts a `Formatter` function.
- **`lineFormatter`**: Customizes line appearance.
- **`title`**: Adds a title above the plot.
- **`xLabel`**: Sets label for x-axis.
- **`yLabel`**: Sets label for y-axis.
- **`thresholds`**: Adds thresholds with optional color.
- **`fillArea`**: If true, fills the area below each line.
- **`hideXAxis`**: Hides the x-axis if true.
- **`hideYAxis`**: Hides the y-axis if true.
- **`symbols`**: Customizes symbols for chart, axis, and background.

### Example Usage

Create and display a simple plot with a title:

```typescript
plot(
  [
    [1, 2],
    [2, 4],
    [3, 6],
  ],
  { title: 'Sample Data', width: 10, height: 6 }
);
```

Output:

```bash
Sample Data
   ▲
  6┤  ┏━
   │  ┃
  4┤  ┃
  2┤━━┛
   └─▶
    1 2 3
```

### Plot with Multiple Series and Colors

```typescript
plot(
  [
    [
      [1, 1],
      [2, 4],
      [3, 9],
    ],
    [
      [1, 3],
      [2, 6],
      [3, 3],
    ],
  ],
  { color: ['ansiRed', 'ansiBlue'], width: 15, height: 7 }
);
```

## Examples

This README includes various examples with plots for titles, multi-series data, axis labels, area filling, custom symbols, and more.

For any questions or additional details, see the [documentation](https://simple-ascii-chart.vercel.app/).
