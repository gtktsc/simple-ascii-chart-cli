import fs from 'fs';
import path from 'path';

import {
  assertUniqueSnapshotPaths,
  cliSnapshotExamples,
  formatCliSnapshot,
  getSnapshotRelativePath,
} from '../examples';

import type { CliExample, CliResult } from '../examples';

const snapshotDirectory = path.resolve(__dirname, '../../__snapshots__');

type RunCli = (
  args: string[],
  options?: { closeStdin?: boolean; stdin?: string },
) => Promise<CliResult>;

/**
 * Registers exact-output tests for every cataloged CLI usage example.
 *
 * @param {RunCli} runCli - Spawn-backed CLI runner owned by the integration suite.
 */
export const registerCliUsageSnapshotTests = (runCli: RunCli): void => {
  describe('CLI usage snapshot catalog', () => {
    it('contains at least 214 unique foldered examples across every public method', () => {
      expect(cliSnapshotExamples.length).toBeGreaterThanOrEqual(214);
      expect(() => assertUniqueSnapshotPaths(cliSnapshotExamples)).not.toThrow();
      expect(new Set(cliSnapshotExamples.map(({ group }) => group))).toEqual(
        new Set(['candlestick', 'heatmap', 'histogram', 'plot', 'render-chart', 'sparkline']),
      );
    });

    cliSnapshotExamples.forEach((example: CliExample) => {
      it(`matches snapshot: ${example.group}: ${example.title}`, async () => {
        const actual = await runCli([...example.args], { stdin: example.stdin });
        const filePath = path.join(snapshotDirectory, getSnapshotRelativePath(example));
        const expected = fs.readFileSync(filePath, 'utf8');

        expect(formatCliSnapshot(example, actual)).toBe(expected);
      });
    });
  });
};
