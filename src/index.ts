import { printAndResetSummary } from './summary.js';

// TODO: code should be organized to clearly differentiate between public and internal
export * from './given-when-then.js';
export { expect } from './expect.js';
export * from './helpers.js';
export * from './reporter.js';

if (!("__tomato_runner" in globalThis)) {
  process.on('beforeExit', async () => {
    const { failures } = await printAndResetSummary();
    if (failures.length > 0) {
      process.exit(1);
    }
  });
}
