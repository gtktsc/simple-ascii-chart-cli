
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

Requires Node.js 22 or newer, matching `simple-ascii-chart@6`.

Install globally:

```bash
npm install -g simple-ascii-chart-cli
```

Or add it as a project dependency:

```bash
yarn add simple-ascii-chart-cli
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
simple-ascii-chart --input '[[1, 2], [2, 3], [3, 4]]' --title "Sample Chart"
```

Compatibility alias: `simple-ascii-chart-cli` is also available.

### API methods

`--method` selects the `simple-ascii-chart` runtime export. It defaults to `plot`, so existing
commands keep working.

| Method | `--input` | `--options` | Output |
|---|---|---|---|
| `plot` | Numeric coordinates | `Settings` object | Chart text |
| `renderChart` | Complete `ChartSpec`, or a series array | Remaining `ChartSpec` fields | Chart text |
| `candlestick` | Complete `CandlestickSpec`, or OHLC data | Remaining spec fields | Chart text |
| `heatmap` | Complete `HeatmapSpec`, or matrix data | Remaining spec fields | Chart text |
| `sparkline` | Number/null array | `SparklineOptions` | Sparkline text |
| `histogram` | Raw samples or `[x,count]` buckets | `HistogramOptions` | Normalized JSON buckets |

For one-spec methods, object input is a complete spec. Array input is wrapped as `series` for
`renderChart` and `data` for `candlestick`/`heatmap`; `--options` supplies other spec fields. Input
fields override duplicate fields in `--options`.

```bash
simple-ascii-chart --method renderChart \
  --input '[{"id":"revenue","data":[["Jan",2],["Feb",4]],"mode":"bar"}]' \
  --options '{"title":"Quarterly","xAxis":{"scale":"band"},"width":30,"height":8}'

simple-ascii-chart --method candlestick \
  --input '[[1,10,13,9,12],[2,12,14,10,11]]' \
  --options '{"title":"OHLC","width":24,"height":8}'

simple-ascii-chart --method heatmap \
  --input '[["ok","warn"],["warn","ok"]]' \
  --options '{"rows":["api","worker"],"levels":[{"value":"ok","symbol":"."},{"value":"warn","symbol":"!"}]}'

simple-ascii-chart --method sparkline --input '[1,2,null,4]'
simple-ascii-chart --method histogram --input '[1,1,2,2,2,4]' --options '{"binCount":3}'
```

### CLI Options

| Option            | Alias | Type     | Description                                                                                           |
|-------------------|-------|----------|-------------------------------------------------------------------------------------------------------|
| `--method`        |       | string   | API method: `plot`, `renderChart`, `candlestick`, `heatmap`, `sparkline`, or `histogram`.             |
| `--input`         | `-i`  | string   | Inline input payload (JSON by default).                                                               |
| `--input-file`    |       | string   | Read static input from a file path.                                                                   |
| `--format`        |       | string   | Static input format: `json`, `csv`, `tsv`, `space`. Auto-detected when omitted.                      |
| `--delimiter`     |       | string   | Custom delimiter for delimited static input.                                                          |
| `--header`        |       | boolean  | Treat first delimited row as a header row.                                                            |
| `--x-col`         |       | string   | X selector for delimited input (1-based index or header name).                                        |
| `--y-col`         |       | string   | Y selector for delimited input (1-based index or header name).                                        |
| `--stream`        |       | boolean  | Enable streaming mode and read newline-delimited samples from stdin.                                  |
| `--window`        |       | number   | Keep only the latest N stream samples. Default: `60`.                                                 |
| `--refresh-ms`    |       | number   | Redraw throttle in milliseconds. Default: `200`.                                                      |
| `--rate`          |       | boolean  | Treat streamed values as counters and plot per-second rates.                                          |
| `--series`        |       | number   | Stream series count (`1` or `2`).                                                                     |
| `--passthrough`   |       | boolean  | Forward streamed stdin lines to stdout while plotting.                                                 |
| `--plot-output`   |       | string   | Plot destination stream: `stdout` or `stderr`.                                                        |
| `--options`       | `-o`  | string   | Plot settings, method options, or remaining spec fields as JSON.                                       |
| `--width`         | `-w`  | string   | Positive plot width or `auto`.                                                                        |
| `--height`        | `-h`  | number   | Plot height.                                                                                          |
| `--aspect-ratio`  |       | number   | Physical width-to-height ratio used to derive height.                                                 |
| `--title`         | `-t`  | string   | Plot title.                                                                                           |
| `--xLabel`        |       | string   | X axis label.                                                                                         |
| `--yLabel`        |       | string   | Y axis label.                                                                                         |
| `--mode`          |       | string   | Graph mode: `line`, `point`, `bar`, `horizontalBar`.                                                  |
| `--color`         | `-c`  | array    | ANSI colors for plot elements.                                                                        |
| `--axisCenter`    |       | array    | Axis center coordinates (`--axisCenter 0 0`).                                                         |
| `--yRange`        |       | array    | Y range (`--yRange 0 100`).                                                                           |
| `--showTickLabel` |       | boolean  | Show axis tick labels.                                                                                |
| `--hide-x-axis-ticks` |   | boolean  | Hide X ticks/labels while retaining the axis line.                                                     |
| `--hide-y-axis-ticks` |   | boolean  | Hide Y ticks/labels while retaining the axis line.                                                     |
| `--custom-x-axis-ticks` | | array    | Explicit numeric X tick values.                                                                       |
| `--custom-y-axis-ticks` | | array    | Explicit numeric Y tick values.                                                                       |
| `--renderer`      |       | string   | Plot backend: `ascii` or `braille`.                                                                   |
| `--overflow`      |       | string   | Out-of-domain behavior: `clip` or `discard`.                                                          |
| `--interpolation` |       | string   | Line interpolation: `step` or `linear`.                                                               |
| `--bar-layout`    |       | string   | Bar layout: `overlap`, `grouped`, `stacked`, or `normalized`.                                         |
| `--coloring`      |       | string   | Dynamic coloring configuration as JSON.                                                               |
| `--value-labels`  |       | string   | Bar value labels as `true`, `false`, or a JSON object.                                                |
| `--x-axis`        |       | string   | Structured X-axis configuration as JSON.                                                              |
| `--y-axis`        |       | string   | Structured Y-axis configuration as JSON.                                                              |
| `--title-color`   |       | string   | ANSI title color, including version 6 bright colors.                                                  |
| `--border-color`  |       | string   | ANSI border color.                                                                                    |
| `--background-color` |    | string   | ANSI background-glyph color.                                                                          |
| `--thresholds`    |       | array    | JSON object/array string or tokenized JSON objects (`'{"y":2}'`, `'[{"y":2}]'`, `'{"y":2}' '{"x":3}'`). |
| `--points`        |       | array    | JSON object/array string or tokenized JSON objects (`'{"x":1,"y":2}'`, `'[{"x":1,"y":2}]'`).         |
| `--legend`        |       | string   | Legend settings in JSON format.                                                                       |
| `--formatter`     |       | string   | Axis formatter function string.                                                                       |
| `--lineFormatter` |       | string   | Line formatter function string.                                                                       |
| `--symbols`       |       | string   | Custom symbols in JSON format.                                                                        |
| `--debugMode`     |       | boolean  | Enable chart engine debug mode.                                                                       |
| `--fillArea`      |       | boolean  | Fill plot area.                                                                                       |
| `--hideXAxis`     |       | boolean  | Hide the x axis.                                                                                      |
| `--hideYAxis`     |       | boolean  | Hide the y axis.                                                                                      |
| `--verbose`       |       | boolean  | Print stack/details for parse/runtime errors.                                                         |

Static stdin example (no `--input` needed):

```bash
printf '1 1\n2 4\n3 9\n' | simple-ascii-chart --format space --title "stdin plot"
```

Threshold example:

```bash
simple-ascii-chart --input '[[1,1],[2,2],[3,3]]' --thresholds '{"y":2,"color":"ansiRed"}'
```

Points example:

```bash
simple-ascii-chart --input '[[1,1],[2,1],[3,1]]' --points '[{"x":2,"y":3,"color":"ansiGreen"}]'
```

Debug mode example:

```bash
simple-ascii-chart --input '[[1,1],[2,2],[3,3]]' --debugMode true
```

## Live CPU Chart

Stream CPU samples directly into the chart.

Input formats accepted by `--stream`:
- `NUMBER` (x-axis uses sample time; default labels are elapsed like `+0s`, `+1s`)
- `X,Y`

macOS one-liner (`top`-based):

```bash
while true; do top -l 1 | awk -F'[, %]+' '/^CPU usage:/ {print $3+$6}'; sleep 1; done | simple-ascii-chart --stream --window 60 --height 10 --yRange 0 100 --title "CPU usage %"
```

Linux one-liner (`vmstat`-based):

```bash
vmstat 1 | awk 'NR>2 {print 100-$15}' | simple-ascii-chart --stream --window 60 --height 10 --yRange 0 100 --title "CPU usage %"
```

## Live Network Bandwidth Chart

Stream network bandwidth (Mbps) into the chart.

macOS one-liner (default interface, total rx+tx):

```bash
IFACE=$(route -n get default 2>/dev/null | awk '/interface:/{print $2}'); PREV=$(netstat -ib -I "$IFACE" | awk 'NR>1 {sum+=$7+$10} END {print sum}'); while true; do sleep 1; CUR=$(netstat -ib -I "$IFACE" | awk 'NR>1 {sum+=$7+$10} END {print sum}'); awk -v c="$CUR" -v p="$PREV" 'BEGIN {printf "%.2f\n", (c-p)*8/1000000}'; PREV="$CUR"; done | simple-ascii-chart --stream --window 60 --height 10 --yRange 0 1000 --title "Network Mbps (rx+tx)"
```

Linux one-liner (default interface, total rx+tx):

```bash
IFACE=$(ip route | awk '/default/ {print $5; exit}'); PREV_RX=$(cat /sys/class/net/$IFACE/statistics/rx_bytes); PREV_TX=$(cat /sys/class/net/$IFACE/statistics/tx_bytes); while true; do sleep 1; CUR_RX=$(cat /sys/class/net/$IFACE/statistics/rx_bytes); CUR_TX=$(cat /sys/class/net/$IFACE/statistics/tx_bytes); awk -v cr="$CUR_RX" -v pr="$PREV_RX" -v ct="$CUR_TX" -v pt="$PREV_TX" 'BEGIN {printf "%.2f\n", ((cr-pr)+(ct-pt))*8/1000000}'; PREV_RX="$CUR_RX"; PREV_TX="$CUR_TX"; done | simple-ascii-chart --stream --window 60 --height 10 --yRange 0 1000 --title "Network Mbps (rx+tx)"
```

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

### Snapshot catalog

The repository also contains 224 executable CLI usage examples covering every public method.
Definitions live in `src/examples/`; exact command, exit code, stdout, and stderr snapshots live in grouped `__snapshots__/` folders.

```bash
npm run snapshots:generate
npm test -- --runInBand
```

For any questions or additional details, see the [documentation](https://simple-ascii-chart.vercel.app/).

## Support

If this project helps you, consider supporting my open-source work:

[Buy me a coffee](https://buymeacoffee.com/gtktsc)
