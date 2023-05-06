import { test, Given, When, Then, expect, run } from '@tomato/tomato-prev';
import * as src from './given-when-then.js'
import { reporter, setReporter, reporters } from './reporter.js';
import { runAsync } from './helpers.js';

await test('test parallel execution', async() => {
  Given('2 async tests');
  const testFn = () => new Promise<void>(resolve => setTimeout(resolve, 100));

  When('running in parallel');

  const originalReporter = reporter;
  setReporter(reporters.noop);
  const res = await runAsync(async () => {
    const t1 = src.test("Test 1", testFn);
    const t2 = src.test("Test 2", testFn);
    // Make sure to run them both to completion, otherwise we'll get some stray logs
    await Promise.allSettled([t1,t2]);
    // This one throws the failed errors
    await Promise.all([t1, t2]);
  });
  // TODO: proper cleanup
  setReporter(originalReporter);

  Then('an error is thrown');

  expect(res.err?.message).toBe("Cannot run multiple tests in parallel. Did you forget to `await` your test?");
});
