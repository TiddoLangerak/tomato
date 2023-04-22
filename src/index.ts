import { fileURLToPath } from 'node:url';
import { printAndResetSummary } from './summary.js';
import { runAll } from './runner.js';
export * from './given-when-then.js';
export * from './assert.js';

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFile) {
  runAll();
} else {
  process.on('beforeExit', printAndResetSummary);
}


