import { printAndResetSummary } from './summary.js';

export * from './given-when-then.js';
export * from './assert.js';

if (!globalThis.__tomato_runner) {
  process.on('beforeExit', printAndResetSummary);
}


