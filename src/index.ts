import { printAndResetSummary } from './summary.js';

export * from './given-when-then.js';
export { expect } from './expect.js';

if (!("__tomato_runner" in globalThis)) {
  process.on('beforeExit', printAndResetSummary);
}
