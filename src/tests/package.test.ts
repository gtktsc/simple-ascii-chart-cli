import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import path from 'path';

type PackFile = {
  path: string;
};

type PackResult = {
  files?: PackFile[];
};

const projectRootPath = path.resolve(__dirname, '../..');

describe('package metadata and publish artifacts', () => {
  let fixtureRoot = '';
  let fixtureDistPath = '';

  beforeAll(() => {
    fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'simple-ascii-chart-package-'));
    fixtureDistPath = path.join(fixtureRoot, 'dist');

    execSync(`npx tsc -p tsconfig.build.json --outDir "${fixtureDistPath}"`, {
      cwd: projectRootPath,
      stdio: 'pipe',
    });

    const packageJsonPath = path.join(projectRootPath, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as Record<string, unknown>;

    fs.writeFileSync(path.join(fixtureRoot, 'package.json'), JSON.stringify(packageJson, null, 2), 'utf8');
  });

  afterAll(() => {
    if (fixtureRoot) {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  it('uses simple-ascii-chart 6 without adding runtime dependencies', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(projectRootPath, 'package.json'), 'utf8'),
    ) as { dependencies: Record<string, string>; engines: { node: string } };

    expect(packageJson.dependencies['simple-ascii-chart']).toBe('^6.0.0');
    expect(Object.keys(packageJson.dependencies).sort()).toEqual(['simple-ascii-chart', 'yargs']);
    expect(packageJson.engines.node).toBe('>=22');
  });

  it('declared entrypoints exist on disk', () => {
    const packageJsonPath = path.join(fixtureRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
      main: string;
      types: string;
      bin: Record<string, string>;
    };

    expect(fs.existsSync(path.join(fixtureRoot, packageJson.main))).toBe(true);
    expect(fs.existsSync(path.join(fixtureRoot, packageJson.types))).toBe(true);

    Object.values(packageJson.bin).forEach((binPath) => {
      expect(fs.existsSync(path.join(fixtureRoot, binPath))).toBe(true);
    });
  });

  it('executes the compiled CLI entrypoint', () => {
    const helpText = execSync('node ./dist/cli.js --help', {
      cwd: fixtureRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_PATH: path.join(projectRootPath, 'node_modules'),
      },
    });

    expect(helpText).toContain('--stream');
    expect(helpText).toContain('--input-file');
    expect(helpText).toContain('--method');
  });

  it('does not include compiled test artifacts in npm pack output', () => {
    const packageJsonPath = path.join(fixtureRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as Record<string, unknown>;
    const scripts = ((packageJson.scripts as Record<string, string> | undefined) ?? {}) as Record<
      string,
      string
    >;
    const { prepare, ...remainingScripts } = scripts;
    void prepare;

    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(
        {
          ...packageJson,
          scripts: remainingScripts,
        },
        null,
        2,
      ),
      'utf8',
    );

    const npmCachePath = path.join(fixtureRoot, '.npm-cache');
    fs.mkdirSync(npmCachePath, { recursive: true });

    const output = execSync('npm pack --dry-run --json', {
      cwd: fixtureRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        npm_config_cache: npmCachePath,
      },
    });

    const parsed = JSON.parse(output) as PackResult[];
    const files = parsed[0]?.files?.map((file) => file.path) ?? [];

    expect(files).toContain('dist/cli.js');
    expect(files).toContain('dist/index.js');
    expect(files.some((filePath) => filePath.includes('dist/tests/'))).toBe(false);
    expect(files.some((filePath) => filePath.endsWith('.test.js'))).toBe(false);
    expect(files.some((filePath) => filePath.endsWith('.test.d.ts'))).toBe(false);
    expect(fs.existsSync(fixtureDistPath)).toBe(true);
  });
});
