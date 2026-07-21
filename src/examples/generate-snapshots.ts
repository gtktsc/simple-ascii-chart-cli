import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import {
  assertUniqueSnapshotPaths,
  cliSnapshotExamples,
  formatCliSnapshot,
  getSnapshotRelativePath,
} from './index';

import type { CliResult } from './types';

const projectRootPath = path.resolve(__dirname, '../..');
const runtimeCliPath = path.resolve(__dirname, '../cli.js');
const snapshotDirectory = path.join(projectRootPath, '__snapshots__');

assertUniqueSnapshotPaths(cliSnapshotExamples);

const snapshots = cliSnapshotExamples.map((example) => {
  const processResult = spawnSync(process.execPath, [runtimeCliPath, ...example.args], {
    cwd: projectRootPath,
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_PATH: path.join(projectRootPath, 'node_modules'),
    },
    input: example.stdin,
  });

  if (processResult.error) throw processResult.error;
  if (processResult.signal) {
    throw new Error(`${example.title} exited from signal ${processResult.signal}`);
  }

  const result: CliResult = {
    code: processResult.status,
    stdout: processResult.stdout,
    stderr: processResult.stderr,
  };
  if (result.code !== 0) {
    throw new Error(`${example.title} exited with ${result.code}: ${result.stderr}`);
  }

  return {
    output: formatCliSnapshot(example, result),
    relativePath: getSnapshotRelativePath(example),
  };
});

fs.rmSync(snapshotDirectory, { recursive: true, force: true });
fs.mkdirSync(snapshotDirectory, { recursive: true });

snapshots.forEach(({ output, relativePath }) => {
  const filePath = path.join(snapshotDirectory, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, output);
});
