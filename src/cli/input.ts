import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { fail } from './errors';

import type { CliArguments, InputFormat } from './types';
import type { PlotCoordinates, PlotDatum, Point } from 'simple-ascii-chart';

const parseNumber = (value: string): number | undefined => {
  const parsed = Number(value.trim());

  return Number.isFinite(parsed) ? parsed : undefined;
};

const inferFormatFromFilePath = (inputFile: string): InputFormat => {
  const extension = path.extname(inputFile).toLowerCase();

  if (extension === '.csv') return 'csv';
  if (extension === '.tsv' || extension === '.tab') return 'tsv';
  if (extension === '.space' || extension === '.dat' || extension === '.txt') return 'space';

  return 'json';
};

const inferFormatFromRawInput = (raw: string): InputFormat => {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.startsWith('[') || trimmed.startsWith('{')) {
    return 'json';
  }

  const firstLine = trimmed.split(/\r?\n/, 1)[0];
  if (firstLine.includes('\t')) return 'tsv';
  if (firstLine.includes(',')) return 'csv';

  return 'space';
};

const getInputFormat = ({
  explicit,
  inputFile,
  raw,
}: {
  explicit?: InputFormat;
  inputFile?: string;
  raw: string;
}): InputFormat => {
  if (explicit) return explicit;
  if (inputFile) return inferFormatFromFilePath(inputFile);

  return inferFormatFromRawInput(raw);
};

const isPoint = (value: unknown): value is PlotDatum =>
  Array.isArray(value) &&
  value.length === 2 &&
  typeof value[0] === 'number' &&
  Number.isFinite(value[0]) &&
  (value[1] === null || (typeof value[1] === 'number' && Number.isFinite(value[1])));

const parseJsonValue = (raw: string, sourceLabel: string): unknown => {
  try {
    return JSON.parse(raw) as unknown;
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);

    return fail(`Invalid ${sourceLabel} JSON: ${details}`, error);
  }
};

const parseJsonCoordinates = (raw: string, sourceLabel: string): PlotCoordinates => {
  const parsedUnknown = parseJsonValue(raw, sourceLabel);

  if (!Array.isArray(parsedUnknown)) {
    fail(`Invalid ${sourceLabel}: expected an array`);
  }
  const parsed = parsedUnknown as unknown[];

  if (parsed.length === 0) return [];
  if (parsed.every((item: unknown) => isPoint(item))) return parsed as PlotDatum[];
  if (
    parsed.every(
      (series: unknown) =>
        Array.isArray(series) && (series as unknown[]).every((item: unknown) => isPoint(item)),
    )
  ) {
    return parsed as PlotCoordinates;
  }

  return fail(`Invalid ${sourceLabel}: expected [[x,y], ...] or [[[x,y], ...], ...]`);
};

const splitDelimitedLine = (line: string, format: InputFormat, delimiter?: string): string[] => {
  if (delimiter !== undefined) return line.split(delimiter);
  if (format === 'csv') return line.split(',');
  if (format === 'tsv') return line.split('\t');

  return line.trim().split(/\s+/);
};

const resolveColumnIndex = ({
  column,
  defaultIndex,
  axis,
  headerColumns,
}: {
  column: string | undefined;
  defaultIndex: number;
  axis: 'x' | 'y';
  headerColumns?: string[];
}): number => {
  if (column === undefined) return defaultIndex;

  if (/^\d+$/.test(column)) {
    const index = Number(column) - 1;
    if (index < 0) fail(`--${axis}-col must be a positive 1-based index`);

    return index;
  }

  if (!headerColumns) {
    return fail(`--${axis}-col="${column}" requires --header or a numeric column index`);
  }

  const index = headerColumns.indexOf(column);
  if (index === -1) fail(`--${axis}-col="${column}" was not found in the header row`);

  return index;
};

const parseDelimitedCoordinates = ({
  raw,
  format,
  delimiter,
  header,
  xCol,
  yCol,
  sourceLabel,
}: {
  raw: string;
  format: InputFormat;
  delimiter?: string;
  header?: boolean;
  xCol?: string;
  yCol?: string;
  sourceLabel: string;
}): PlotCoordinates => {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) fail(`No data found in ${sourceLabel}`);

  const rows = lines.map((line) => splitDelimitedLine(line, format, delimiter));
  const headerColumns = header ? rows[0].map((column) => column.trim()) : undefined;
  const startIndex = header ? 1 : 0;
  const xIndex = resolveColumnIndex({
    column: xCol,
    defaultIndex: 0,
    axis: 'x',
    headerColumns,
  });
  const yIndex = resolveColumnIndex({
    column: yCol,
    defaultIndex: 1,
    axis: 'y',
    headerColumns,
  });
  const points: Point[] = [];

  for (let index = startIndex; index < rows.length; index += 1) {
    const row = rows[index];
    const x = parseNumber(row[xIndex] ?? '');
    const y = parseNumber(row[yIndex] ?? '');
    if (x !== undefined && y !== undefined) points.push([x, y]);
  }

  if (points.length === 0) fail(`No valid numeric points could be parsed from ${sourceLabel}`);

  return points;
};

const parseCoordinatesFromRaw = ({
  raw,
  args,
  sourceLabel,
  inputFile,
}: {
  raw: string;
  args: CliArguments;
  sourceLabel: string;
  inputFile?: string;
}): PlotCoordinates => {
  const format = getInputFormat({ explicit: args.format, inputFile, raw });
  if (format === 'json') return parseJsonCoordinates(raw, sourceLabel);

  return parseDelimitedCoordinates({
    raw,
    format,
    delimiter: args.delimiter,
    header: args.header,
    xCol: args.xCol,
    yCol: args.yCol,
    sourceLabel,
  });
};

const readStdinText = async (): Promise<string> =>
  new Promise((resolve, reject) => {
    let output = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk: string) => {
      output += chunk;
    });
    process.stdin.on('error', reject);
    process.stdin.on('end', () => resolve(output));
  });

/**
 * Reads and parses plot coordinates from inline, file, or stdin input.
 *
 * @param {CliArguments} args - Parsed CLI arguments.
 * @returns {Promise<PlotCoordinates>} Parsed plot coordinates.
 */
export const getStaticInput = async (args: CliArguments): Promise<PlotCoordinates> => {
  if (args.input !== undefined) {
    if (!args.input.trim()) {
      fail('`--input` was provided but empty. Pass coordinate data or use --input-file/stdin.');
    }

    return parseCoordinatesFromRaw({ raw: args.input, args, sourceLabel: '--input' });
  }

  if (args.inputFile) {
    try {
      const content = await fs.readFile(args.inputFile, 'utf8');

      return parseCoordinatesFromRaw({
        raw: content,
        args,
        sourceLabel: `file ${args.inputFile}`,
        inputFile: args.inputFile,
      });
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);

      return fail(`Unable to read --input-file "${args.inputFile}": ${details}`, error);
    }
  }

  if (!process.stdin.isTTY) {
    const stdinContent = await readStdinText();
    if (!stdinContent.trim()) fail('Stdin is empty. Pipe data or provide --input/--input-file.');

    return parseCoordinatesFromRaw({ raw: stdinContent, args, sourceLabel: 'stdin' });
  }

  return fail('Missing input. Provide --input, --input-file, or pipe data via stdin.');
};

/**
 * Reads and parses JSON input for non-plot API methods.
 *
 * @param {CliArguments} args - Parsed CLI arguments.
 * @returns {Promise<unknown>} Parsed JSON input.
 */
export const getJsonInput = async (args: CliArguments): Promise<unknown> => {
  if (args.format !== undefined && args.format !== 'json') {
    fail(`--format ${args.format} is only supported with --method plot`);
  }

  if (args.input !== undefined) {
    if (!args.input.trim()) {
      fail('`--input` was provided but empty. Pass JSON data or use --input-file/stdin.');
    }

    return parseJsonValue(args.input, '--input');
  }

  if (args.inputFile) {
    let content: string;
    try {
      content = await fs.readFile(args.inputFile, 'utf8');
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);

      return fail(`Unable to read --input-file "${args.inputFile}": ${details}`, error);
    }

    return parseJsonValue(content, `file ${args.inputFile}`);
  }

  if (!process.stdin.isTTY) {
    const stdinContent = await readStdinText();
    if (!stdinContent.trim()) {
      fail('Stdin is empty. Pipe JSON data or provide --input/--input-file.');
    }

    return parseJsonValue(stdinContent, 'stdin');
  }

  return fail('Missing input. Provide --input, --input-file, or pipe JSON data via stdin.');
};
