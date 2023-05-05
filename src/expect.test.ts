import { test, Given, When, Then, And} from '@tomato/tomato-prev';

import { expect, NotIdenticalError, FunctionDidNotThrowError, IncorrectErrorClass } from './expect.js';
import { __resetDifftool, __setDifftool } from './diff.js';
// TODO: add to tomato-prev after release
import { run } from './helpers.js';

/**
 * Note that we can't use expectations here directly ourselves, as this is what we're testing :)
 *
 * TODO: once we've published the first set of expectations, we can piggy-back on older versions
 */

await test('expect.toBe with matching expectation', () => {
  Given('a test result');

  const testResult = 3;

  When('it matches the expectation');

  const res = run(() => expect(testResult).toBe(3));

  Then('it succeeds');

  assert(res.error === undefined);

});

await test('expect.toBe with mismatching expectation', () => {
  Given('a test result');

  const testResult = 3;

  When(`it doesn't match the expectation`);

  const res = run(() => expect(testResult).toBe(2));

  Then('it fails with a NotIdenticalError');

  assert(res.error instanceof NotIdenticalError);
  assert(
    res.error.message ===
`Expected values to be equal.
Expected:
    │ 2
Found:
    │ 3`
        );
});

await test(`expect.toBe with mismatching test based expection`, async () => {
  Given('a text based test result');

  const testResult = "foo\nbar";

  And('a mock difftool');

  __setDifftool("cat");

  When("the text doesn't match the expectation");

  const res = run(() => expect(testResult).toBe("baz\n"));

  Then("the error includes the output of the difftool");

  assert(
    await res.error.displayError() ===
`Expected values to be equal.
Expected:
    │ baz

Found:
    │ foo
    │ bar
Diff command output:
    │ baz
    │ foo
    │ bar`);

  // TODO: proper cleanup, also on failure
  __resetDifftool();
});

await test('expect.toThrow with function that throws', () => {
  Given('a function that throws');

  const f = () => { throw new Error() };

  When('it is expected to throw');

  const res = run(() => expect(f).toThrow());

  Then('it succeeds');

  assert(res.error === undefined);
});

await test("expect.toThrow with function that doesn't throw", () => {
  Given("a function that doesn't throw");

  const f = () => {};

  When('it is expected to throw');

  const res = run(() => expect(f).toThrow());

  Then('it fails with a FunctionDidNotThrowError');

  assert(res.error instanceof FunctionDidNotThrowError);
});

await test("expect.toThrow with a function that throws and an expected exception", () => {
  class MyError extends Error {}

  Given("a function that throws a 'MyError'");

  const f = () => { throw new MyError() };

  When("it is expected to throw a 'MyError'");

  const res = run(() => expect(f).toThrow(MyError));

  Then('it succeeds');

  assert(res.error === undefined);
});

await test("expected.toThrow with a function that throws and a different expected exception", () => {
  class MyError extends Error {}
  class YourError extends Error {}

  Given("a function that throws a 'MyError'");

  const f = () => { throw new MyError() };

  When("it is expected to throw a 'YourError'");

  const res = run(() => expect(f).toThrow(YourError));

  Then("it fails with an IncorrectErrorClass error");

  assert(res.error instanceof IncorrectErrorClass);
  // TODO: this error message can be more descriptive
  assert(
    res.error.message ===
    `Expected function to throw an instance of YourError, but received Error`
  );
});

function assert(condition: boolean) {
  if (!condition) {
    throw new Error("Assertion failed");
  }
}
