import { test, given, when, then} from '@tomato/tomato-prev';

import { expect, NotIdenticalError, FunctionDidNotThrowError, IncorrectErrorClass } from './expect.js';

/**
 * Note that we can't use expectations here directly ourselves, as this is what we're testing :)
 *
 * TODO: once we've published the first set of expectations, we can piggy-back on older versions
 */

await test('expect.toBe with matching expectation', () => {
  given('a test result');

  const testResult = 3;

  when('it matches the expectation');

  const res = run(() => expect(testResult).toBe(3));

  then('it succeeds');

  assert(res.error === undefined);

});

await test('expect.toBe with mismatching expectation', () => {
  given('a test result');

  const testResult = 3;

  when(`it doesn't match the expectation`);

  const res = run(() => expect(testResult).toBe(2));

  then('it fails with a NotIdenticalError');

  assert(res.error instanceof NotIdenticalError);
  // TODO: fix the error message here
  assert(
    res.error.message ===
`Expected values to be equal.
Expected:
    │2
Found:
    │3`
        );
});

await test('expect.toThrow with function that throws', () => {
  given('a function that throws');

  const f = () => { throw new Error() };

  when('it is expected to throw');

  const res = run(() => expect(f).toThrow());

  then('it succeeds');

  assert(res.error === undefined);
});

await test("expect.toThrow with function that doesn't throw", () => {
  given("a function that doesn't throw");

  const f = () => {};

  when('it is expected to throw');

  const res = run(() => expect(f).toThrow());

  then('it fails with a FunctionDidNotThrowError');

  assert(res.error instanceof FunctionDidNotThrowError);
});

await test("expect.toThrow with a function that throws and an expected exception", () => {
  class MyError extends Error {}

  given("a function that throws a 'MyError'");

  const f = () => { throw new MyError() };

  when("it is expected to throw a 'MyError'");

  const res = run(() => expect(f).toThrow(MyError));

  then('it succeeds');

  assert(res.error === undefined);
});

await test("expected.toThrow with a function that throws and a different expected exception", () => {
  class MyError extends Error {}
  class YourError extends Error {}

  given("a function that throws a 'MyError'");

  const f = () => { throw new MyError() };

  when("it is expected to throw a 'YourError'");

  const res = run(() => expect(f).toThrow(YourError));

  then("it fails with an IncorrectErrorClass error");

  assert(res.error instanceof IncorrectErrorClass);
  // TODO: this error message can be more descriptive
  assert(
    res.error.message ===
    `Expected function to throw an instance of YourError, but received Error`
  );
});

function run<T>(f: () => T): { val? : T, error?: any } {
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
