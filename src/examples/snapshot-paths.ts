import type { CliExample } from './types';

const sanitizeSnapshotTitle = (title: string): string =>
  title
    .replace(/ \[(?:ascii|braille)\]$/, '')
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

/**
 * Returns one collision-safe, grouped snapshot path.
 *
 * @param {CliExample} example - CLI example metadata.
 * @returns {string} Relative path below the snapshot root.
 */
export const getSnapshotRelativePath = (example: CliExample): string => {
  const folders: string[] = [example.group];
  if (example.renderer) folders.push(example.renderer);

  return [...folders, `${sanitizeSnapshotTitle(example.title)}.txt`].join('/');
};

/**
 * Rejects catalog entries that resolve to the same snapshot path.
 *
 * @param {readonly CliExample[]} examples - Complete CLI example catalog.
 */
export const assertUniqueSnapshotPaths = (examples: readonly CliExample[]): void => {
  const paths = new Map<string, string>();
  examples.forEach((example) => {
    const relativePath = getSnapshotRelativePath(example);
    const previousTitle = paths.get(relativePath);
    if (previousTitle !== undefined) {
      throw new Error(
        `Snapshot path collision: "${previousTitle}" and "${example.title}" both map to "${relativePath}"`,
      );
    }
    paths.set(relativePath, example.title);
  });
};
