import { printAndResetSummary } from './summary.js';

export * from './given-when-then.js';
export * from './assert.js';

if (!("__tomato_runner" in globalThis)) {
  process.on('beforeExit', printAndResetSummary);
}
