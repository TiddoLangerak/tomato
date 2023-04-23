export type ExpectationError = {
  displayError: () => string;
};

export class BaseExpectationError extends Error {
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

export class FunctionDidNotThrowError extends BaseExpectationError {
  constructor() {
    super(
      `Expected function to throw, but it didn't`
    );
  }
}

export class IncorrectErrorClass extends BaseExpectationError {
  constructor(expected: Function, received: any) {
    super(
      `Expected function to throw an instance of ${expected.name}, but received ${received}`
    );
  }
}

type BaseExpectation<T> = {
  toBe(expected: T): void;
}

type FunctionExpectation<T extends Function> = {
  toThrow(expected?: Function): void;
}

type Expectation<T> = BaseExpectation<T> & (T extends Function ? FunctionExpectation<T> : {} );


export function expect<T>(subject: T): Expectation<T> {
  const base: BaseExpectation<T> = {
    toBe(expected: T) {
      if (subject !== expected) {
        throw new NotIdenticalError(expected, subject);
      }
    }
  }

  if (typeof subject === 'function') {
    const func: FunctionExpectation<T & Function> = {
      toThrow: (expected?: Function) => {
        try {
          subject();
        } catch (e) {
          if (expected && !(e instanceof expected)) {
            throw new IncorrectErrorClass(expected, e);
          }
          return;
        }
        throw new FunctionDidNotThrowError();
      }
    }
    return { ...base, ...func } as Expectation<T & Function>;
  } else {
    return base as Expectation<T>;
  }
}
