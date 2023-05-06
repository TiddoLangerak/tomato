import { test, Given, When, Then, expect, And, run } from '@tomato/tomato-prev';
import * as src from './given-when-then.js'
import { runAsync } from './helpers.js';

await test('test parallel execution', async() => {
  Given('2 async tests');
  const test1 = () => new Promise<void>(resolve => setTimeout(resolve, 100));
  const test2 = () => new Promise<void>(resolve => setTimeout(resolve, 100));

  When('running in parallel');

  // TODO: capture output
  const res = await runAsync(async () => {
    await Promise.all([
      src.test("Test 1", test1),
      src.test("Test 2", test2)
    ]);
  });

  Then('an error is thrown');
  // TODO: assertions for exceptions
  expect(res.err?.message).toBe("Cannot run multiple tests in parallel. Did you forget to `await` your test?");
});
