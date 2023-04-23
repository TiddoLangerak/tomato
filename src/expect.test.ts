import { test, given, when, then} from '@tomato/tomato';

import { expect, NotIdenticalError } from './index.js';

/**
 * Note that we can't use expectations here directly ourselves, as this is what we're testing :)
 *
 * TODO: once we've published the first set of expectations, we can piggy-back on older versions
 */

await test('expect.toBe success', () => {
  given('a test result');

  const testResult = 3;

  when('it matches the expectation');

  const res = run(() => expect(testResult).toBe(3));

  then('no exception is thrown');

  assert(res.error === undefined);

});

await test('expect.toBe failure', () => {
  given('a test result');

  const testResult = 3;

  when(`it doesn't match the expectation`);

  const res = run(() => expect(testResult).toBe(2));

  then('an exception is thrown');

  assert(res.error instanceof NotIdenticalError);
});

function run(f: () => void) {
  try {
    const val = f();
    return {val};
  } catch (error) {
    return {error};
  }
}

function assert(condition: boolean) {
  if (!condition) {
    throw new Error("Assertion failed");
  }
}
