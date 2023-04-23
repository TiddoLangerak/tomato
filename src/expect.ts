export type ExpectationError = {
  displayError: () => string;
};

class BaseExpectationError extends Error {
  constructor(private msg: string) { super(msg); }
  displayError = () => this.msg;
}

export class NotIdenticalError<T> extends BaseExpectationError {
  constructor(expected: T, other: T) {
    super(
`Expected values to be equal.
Expected: ${expected}
Found: ${other}`);
  }
}

class Expectation<T> {
  constructor(private val: T){}

  toBe = (expected: T) => {
    if (this.val !== expected) {
      throw new NotIdenticalError(expected, this.val);
    }
  }
}

export function expect<T>(subject: T): Expectation<T> {
  return new Expectation(subject);
}
