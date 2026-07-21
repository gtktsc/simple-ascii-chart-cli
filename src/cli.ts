#!/usr/bin/env node

import { parseCliArguments } from './cli/arguments';
import { runMain } from './cli/run';

const argumentsInput = parseCliArguments();

if (argumentsInput instanceof Promise) {
  argumentsInput.then((parsedArguments) => runMain(parsedArguments));
} else {
  void runMain(argumentsInput);
}
