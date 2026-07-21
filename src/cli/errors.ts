class CliError extends Error {
  public constructor(message: string, cause?: unknown) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = 'CliError';
  }
}

/**
 * Throws an actionable CLI error.
 *
 * @param {string} message - User-facing error message.
 * @param {unknown} cause - Optional underlying failure.
 * @returns {never} This function never returns.
 */
export const fail = (message: string, cause?: unknown): never => {
  throw new CliError(message, cause);
};

/**
 * Writes an error and terminates the process.
 *
 * @param {unknown} error - Failure to report.
 * @param {boolean} verbose - Whether to include a stack trace.
 * @returns {never} This function never returns.
 */
export const reportError = (error: unknown, verbose: boolean): never => {
  const primaryMessage =
    error instanceof CliError
      ? error.message
      : error instanceof Error
        ? error.message
        : `Unexpected error: ${String(error)}`;

  process.stderr.write(`${primaryMessage}\n`);

  if (verbose) {
    if (error instanceof CliError && error.cause instanceof Error && error.cause.stack) {
      process.stderr.write(`${error.cause.stack}\n`);
    } else if (error instanceof Error && error.stack) {
      process.stderr.write(`${error.stack}\n`);
    }
  }

  return process.exit(1);
};
