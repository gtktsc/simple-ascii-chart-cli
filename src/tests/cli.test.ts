import { execSync, spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import path from 'path';

type CliResult = {
  code: number | null;
  stdout: string;
  stderr: string;
};

type InteractiveStep = {
  delayMs?: number;
  signal?: NodeJS.Signals;
  write?: string;
};

const clearFrame = '\x1b[2J\x1b[H';
const projectRootPath = path.resolve(__dirname, '../..');
let runtimeCliPath = path.resolve(__dirname, '../../dist/cli.js');

jest.setTimeout(60_000);

const sleep = (milliseconds: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });

const runCli = (
  args: string[],
  {
    stdin,
    closeStdin = true,
  }: {
    stdin?: string;
    closeStdin?: boolean;
  } = {},
): Promise<CliResult> => {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [runtimeCliPath, ...args], {
      cwd: projectRootPath,
      stdio: 'pipe',
      env: {
        ...process.env,
        NODE_PATH: path.join(projectRootPath, 'node_modules'),
      },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });

    if (stdin !== undefined) {
      child.stdin.write(stdin);
    }

    if (closeStdin) {
      child.stdin.end();
    }
  });
};

const runCliInteractive = (args: string[], steps: InteractiveStep[]): Promise<CliResult> => {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [runtimeCliPath, ...args], {
      cwd: projectRootPath,
      stdio: 'pipe',
      env: {
        ...process.env,
        NODE_PATH: path.join(projectRootPath, 'node_modules'),
      },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });

    void (async () => {
      for (const step of steps) {
        if (step.delayMs && step.delayMs > 0) {
          await sleep(step.delayMs);
        }

        if (step.signal) {
          child.kill(step.signal);
        }

        if (step.write !== undefined && !child.stdin.destroyed) {
          child.stdin.write(step.write);
        }
      }

      if (!child.stdin.destroyed) {
        child.stdin.end();
      }
    })().catch(reject);
  });
};

const getFrames = (renderOutput: string) => renderOutput.split(clearFrame).filter(Boolean);

const stripAnsi = (value: string) => value.replace(/\u001b\[[0-9;]*m/g, '');

describe('plotter script', () => {
  let tempDir = '';

  beforeAll(async () => {
    execSync('npm run build --silent', {
      cwd: projectRootPath,
      stdio: 'pipe',
    });

    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'simple-ascii-chart-cli-'));
    const copiedDistPath = path.join(tempDir, 'dist-copy');
    await fs.cp(path.join(projectRootPath, 'dist'), copiedDistPath, {
      recursive: true,
    });
    runtimeCliPath = path.join(copiedDistPath, 'cli.js');
  });

  afterAll(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('returns an actionable error when non-stream mode receives no input', async () => {
    const output = await runCli([]);

    expect(output.code).toBe(1);
    expect(output.stderr).toMatch(/Stdin is empty|Missing input/);
  });

  it('outputs a plot when given valid JSON input', async () => {
    const validInput = JSON.stringify([
      [1, 1],
      [2, 2],
      [3, 3],
    ]);

    const output = await runCli(['--input', validInput]);

    expect(output.code).toBe(0);
    expect(output.stderr).toBe('');
    expect(output.stdout).toContain('└┬┬┬▶');
  });

  it('shows an actionable error for invalid --input JSON', async () => {
    const output = await runCli(['--input', '[ invalid json']);

    expect(output.code).toBe(1);
    expect(output.stderr).toContain('Invalid --input JSON');
  });

  it('shows an actionable error when --input is provided but empty', async () => {
    const output = await runCli(['--input', '']);

    expect(output.code).toBe(1);
    expect(output.stderr).toContain('--input` was provided but empty');
  });

  it('supports static plotting from stdin when --input is omitted', async () => {
    const output = await runCli([], {
      stdin: '1 1\n2 2\n3 3\n',
    });

    expect(output.code).toBe(0);
    expect(output.stderr).toBe('');
    expect(output.stdout).toContain('└┬┬┬▶');
  });

  it('supports --input-file with JSON data', async () => {
    const inputFile = path.join(tempDir, 'sample.json');
    await fs.writeFile(inputFile, '[[1,1],[2,2],[3,3]]', 'utf8');

    const output = await runCli(['--input-file', inputFile]);

    expect(output.code).toBe(0);
    expect(output.stderr).toBe('');
    expect(output.stdout).toContain('└┬┬┬▶');
  });

  it('supports CSV parsing with header and named columns', async () => {
    const inputFile = path.join(tempDir, 'cpu.csv');
    await fs.writeFile(inputFile, 'timestamp,cpu,idle\n1,10,90\n2,20,80\n3,30,70\n', 'utf8');

    const output = await runCli([
      '--input-file',
      inputFile,
      '--format',
      'csv',
      '--header',
      '--x-col',
      'timestamp',
      '--y-col',
      'cpu',
      '--height',
      '6',
      '--width',
      '20',
    ]);

    expect(output.code).toBe(0);
    expect(output.stderr).toBe('');
    expect(output.stdout).toContain('30');
  });

  it('supports TSV and custom delimiter parsing in static mode', async () => {
    const tsvFile = path.join(tempDir, 'cpu.tsv');
    await fs.writeFile(tsvFile, '1\t11\n2\t22\n3\t33\n', 'utf8');

    const tsvOutput = await runCli([
      '--input-file',
      tsvFile,
      '--format',
      'tsv',
      '--height',
      '6',
      '--width',
      '20',
    ]);

    expect(tsvOutput.code).toBe(0);
    expect(tsvOutput.stderr).toBe('');
    expect(tsvOutput.stdout).toContain('33');

    const pipeFile = path.join(tempDir, 'cpu.dat');
    await fs.writeFile(pipeFile, '1|7\n2|8\n3|9\n', 'utf8');

    const delimitedOutput = await runCli([
      '--input-file',
      pipeFile,
      '--format',
      'space',
      '--delimiter',
      '|',
      '--height',
      '6',
      '--width',
      '20',
    ]);

    expect(delimitedOutput.code).toBe(0);
    expect(delimitedOutput.stderr).toBe('');
    expect(delimitedOutput.stdout).toContain('9');
  });

  it('supports stream mode without --input and exits cleanly when stdin closes', async () => {
    const output = await runCli(
      ['--stream', '--window', '5', '--height', '8', '--width', '30', '--yRange', '0', '100'],
      {
        stdin: '10\n20\n30\n',
      },
    );

    expect(output.code).toBe(0);
    expect(output.stderr).toBe('');
    expect(output.stdout).toContain(clearFrame);

    const frames = getFrames(output.stdout);
    const lastFrame = frames[frames.length - 1] ?? '';

    expect(lastFrame).toContain('30');
    expect(lastFrame).toContain('+0s');
    expect(lastFrame).not.toContain(':');
  });

  it('accepts NUMBER and X,Y stream formats, ignores invalid rows, and enforces window size', async () => {
    const output = await runCli(['--stream', '--window', '2', '--height', '8', '--refresh-ms', '0'], {
      stdin: '1,111\n2,222\nnope\n333\n',
    });

    expect(output.code).toBe(0);
    expect(output.stderr).toBe('');

    const frames = getFrames(output.stdout);
    const lastFrame = frames[frames.length - 1] ?? '';

    expect(lastFrame).toContain('333');
    expect(lastFrame).toContain('222');
    expect(lastFrame).not.toContain('111');
  });

  it('supports --rate in stream mode', async () => {
    const oneSample = await runCli(['--stream', '--rate', '--refresh-ms', '0'], {
      stdin: '100\n',
    });

    expect(oneSample.code).toBe(0);
    expect(oneSample.stdout).not.toContain(clearFrame);
  });

  it('supports --series 2 stream parsing', async () => {
    const output = await runCli(['--stream', '--series', '2', '--refresh-ms', '0', '--height', '8'], {
      stdin: '10 20\n20 10\n',
    });

    expect(output.code).toBe(0);
    expect(output.stderr).toBe('');
    expect(output.stdout).toContain(clearFrame);
    expect(output.stdout).toContain('\u001b[36m');
    expect(output.stdout).toContain('\u001b[33m');
  });

  it('handles SIGWINCH while streaming without crashing', async () => {
    const output = await runCliInteractive(['--stream', '--refresh-ms', '0', '--height', '8'], [
      { write: '10\n' },
      { delayMs: 10, signal: 'SIGWINCH' },
      { delayMs: 10, write: '20\n' },
    ]);

    expect(output.code).toBe(0);
    expect(output.stderr).toBe('');
    expect(output.stdout).toContain(clearFrame);
  });

  it('supports --passthrough by forwarding stdin to stdout and charting to stderr', async () => {
    const output = await runCli(['--stream', '--passthrough', '--refresh-ms', '0', '--height', '8'], {
      stdin: '10\n20\n',
    });

    expect(output.code).toBe(0);
    expect(output.stdout).toContain('10\n20\n');
    expect(output.stdout).not.toContain(clearFrame);
    expect(output.stderr).toContain(clearFrame);
  });

  it('rejects --passthrough outside stream mode', async () => {
    const output = await runCli(['--passthrough']);

    expect(output.code).toBe(1);
    expect(output.stderr).toContain('--passthrough is only supported with --stream mode');
  });

  it('rejects --rate outside stream mode', async () => {
    const output = await runCli(['--rate']);

    expect(output.code).toBe(1);
    expect(output.stderr).toContain('--rate is only supported with --stream mode');
  });

  it('renders thresholds from JSON object and JSON array strings', async () => {
    const fromObject = await runCli([
      '--input',
      '[[1,1],[2,2],[3,3]]',
      '--thresholds',
      '{"y":2,"color":"ansiRed"}',
    ]);

    expect(fromObject.code).toBe(0);
    expect(fromObject.stderr).toBe('');
    expect(fromObject.stdout).toContain('\u001b[31m');

    const fromArray = await runCli([
      '--input',
      '[[1,1],[2,2],[3,3]]',
      '--thresholds',
      '[{"y":2,"color":"ansiRed"},{"y":3,"color":"ansiGreen"}]',
    ]);

    expect(fromArray.code).toBe(0);
    expect(fromArray.stderr).toBe('');
    expect(fromArray.stdout).toContain('\u001b[31m');
    expect(fromArray.stdout).toContain('\u001b[32m');
  });

  it('renders points from JSON object and JSON array strings', async () => {
    const fromObject = await runCli([
      '--input',
      '[[1,1],[2,1],[3,1]]',
      '--yRange',
      '0',
      '4',
      '--points',
      '{"x":2,"y":3,"color":"ansiGreen"}',
    ]);

    expect(fromObject.code).toBe(0);
    expect(fromObject.stderr).toBe('');
    expect(fromObject.stdout).toContain('\u001b[32m');

    const fromArray = await runCli([
      '--input',
      '[[1,1],[2,1],[3,1]]',
      '--yRange',
      '0',
      '4',
      '--points',
      '[{"x":1,"y":3,"color":"ansiRed"},{"x":3,"y":3,"color":"ansiGreen"}]',
    ]);

    expect(fromArray.code).toBe(0);
    expect(fromArray.stderr).toBe('');
    expect(fromArray.stdout).toContain('\u001b[31m');
    expect(fromArray.stdout).toContain('\u001b[32m');
  });

  it('applies symbols.point to highlighted points', async () => {
    const output = await runCli([
      '--input',
      '[[1,1],[2,2]]',
      '--points',
      '{"x":2,"y":2}',
      '--symbols',
      '{"point":"*"}',
    ]);

    expect(output.code).toBe(0);
    expect(output.stderr).toBe('');
    expect(output.stdout).toContain('*');
  });

  it('supports legacy tokenized JSON input for thresholds and points', async () => {
    const output = await runCli([
      '--input',
      '[[1,1],[2,1],[3,1]]',
      '--yRange',
      '0',
      '4',
      '--thresholds',
      '{"y":2,"color":"ansiRed"}',
      '{"y":3,"color":"ansiGreen"}',
      '--points',
      '{"x":2,"y":3,"color":"ansiWhite"}',
      '{"x":3,"y":3,"color":"ansiCyan"}',
    ]);

    expect(output.code).toBe(0);
    expect(output.stderr).toBe('');
    expect(output.stdout).toContain('\u001b[32m');
    expect(output.stdout).toContain('\u001b[36m');
    expect(output.stdout).toContain('\u001b[37m');
  });

  it('ignores invalid thresholds/points payloads with warnings and still renders', async () => {
    const output = await runCli([
      '--input',
      '[[1,1],[2,2],[3,3]]',
      '--thresholds',
      'not-json',
      '--points',
      'not-json',
    ]);

    expect(output.code).toBe(0);
    expect(output.stderr).toContain('Ignoring invalid --thresholds payload');
    expect(output.stderr).toContain('Ignoring invalid --points payload');
    expect(output.stdout).toContain('└┬┬┬▶');
  });

  it('accepts --debugMode and exposes it in --help', async () => {
    const helpOutput = await runCli(['--help']);
    expect(helpOutput.code).toBe(0);
    expect(helpOutput.stdout).toContain('--debugMode');

    const runOutput = await runCli([
      '--input',
      '[[1,1],[2,2],[3,3]]',
      '--debugMode',
      'true',
    ]);
    expect(runOutput.code).toBe(0);
    expect(runOutput.stderr).toBe('');
    expect(runOutput.stdout).toContain('└┬┬┬▶');
  });

  it('fails fast for unsupported mode values', async () => {
    const output = await runCli([
      '--input',
      '[[1,1],[2,2],[3,3]]',
      '--mode',
      'banana',
    ]);

    expect(output.code).toBe(1);
    expect(output.stderr).toContain('Invalid values:');
    expect(output.stderr).toContain('mode');
  });

  it('rejects invalid legend payloads with an actionable error', async () => {
    const output = await runCli([
      '--input',
      '[[[1,1],[2,2]],[[1,2],[2,1]]]',
      '--legend',
      '{"position":"middle","series":["A","B"]}',
    ]);

    expect(output.code).toBe(1);
    expect(output.stderr).toContain('Invalid --legend JSON');
  });

  it('fails fast for invalid plot dimensions with actionable errors', async () => {
    const invalidHeight = await runCli(['--input', '[[1,1],[2,2]]', '--height', '-1']);
    expect(invalidHeight.code).toBe(1);
    expect(invalidHeight.stderr).toContain('height must be a positive number');

    const invalidWidth = await runCli(['--input', '[[1,1],[2,2]]', '--width', '-1']);
    expect(invalidWidth.code).toBe(1);
    expect(invalidWidth.stderr).toContain('width must be a positive number');
  });

  it('prints concise parse errors by default and stack details with --verbose', async () => {
    const concise = await runCli([
      '--input',
      '[[1,1],[2,2],[3,3]]',
      '--options',
      '{"bad":',
    ]);

    expect(concise.code).toBe(1);
    expect(concise.stderr).toContain('Invalid --options JSON');
    expect(concise.stderr).not.toContain('Error: Invalid --options JSON');

    const verbose = await runCli([
      '--input',
      '[[1,1],[2,2],[3,3]]',
      '--options',
      '{"bad":',
      '--verbose',
    ]);

    expect(verbose.code).toBe(1);
    expect(verbose.stderr).toContain('Invalid --options JSON');
    expect(verbose.stderr).toContain('Error: Invalid --options JSON');
  });

  it('keeps deterministic static output for snapshot regression checks', async () => {
    const output = await runCli([
      '--input',
      '[[1,1],[2,4],[3,2],[4,5]]',
      '--height',
      '8',
      '--width',
      '18',
      '--title',
      'golden',
    ]);

    expect(output.code).toBe(0);
    expect(output.stderr).toBe('');
    expect(stripAnsi(output.stdout)).toMatchSnapshot();
  });
});
