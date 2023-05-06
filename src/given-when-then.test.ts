import { test, Given, When, Then, expect, run } from '@tomato/tomato-prev';
import * as src from './given-when-then.js'
import { reporter, setReporter, reporters } from './reporter.js';
import { runAsync } from './helpers.js';

const originalReporter = reporter;
setReporter(reporters.noop);

await test('test parallel execution', async() => {
  Given('2 async tests');
  const testFn = () => new Promise<void>(resolve => setTimeout(resolve, 100));

  When('running in parallel');

  const res = await runAsync(async () => {
    const t1 = src.test("Test 1", testFn);
    const t2 = src.test("Test 2", testFn);
    // Make sure to run them both to completion, otherwise we'll get some stray logs
    await Promise.allSettled([t1,t2]);
    // This one throws the failed errors
    await Promise.all([t1, t2]);
  });

  Then('an error is thrown');

  expect(res.err?.message).toBe("Cannot run multiple tests in parallel. Did you forget to `await` your test?");
});

await test('cleanup hooks on success', async() => {
  Given('a test with a cleanup hook');

  let events: string[] = [];
  const testFn = () => {
    events.push('start');
    src.onCleanup(() => events.push('cleanup'));
    events.push('end');
  }

  When('Running the test');

  await src.test("Test", testFn);

  Then("The cleanup function is called after the test ends");

  // TODO: array expects
  expect(events[0]).toBe("start");
  expect(events[1]).toBe("end");
  expect(events[2]).toBe("cleanup");
});

await test('cleanup hooks on failure', async() => {
  Given('a failing test with a cleanup hook');

  let events: string[] = [];
  const testFn = () => {
    events.push('start');
    src.onCleanup(() => events.push('cleanup'));
    events.push("failure");
    throw new Error("Failure");
    events.push('end');
  }

  When('Running the test');

  await src.test("Test", testFn);

  Then("The cleanup function is called after the test ends");

  expect(events[0]).toBe("start");
  expect(events[1]).toBe("failure");
  expect(events[2]).toBe("cleanup");
});

setReporter(originalReporter);
