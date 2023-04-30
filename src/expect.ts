import { green, red } from "./colors.js";
import { formatValue, withIndent } from "./util.js";
import util from 'node:util';

export type ExpectationError = {
  displayError: () => string;
};

export class BaseExpectationError extends Error {
  constructor(protected msg: string) { super(msg); }
  displayError = () => this.msg;
}

function diff<T>(expected: T, other: T, indent: string) {
  if (typeof expected !== 'string' || typeof other !== 'string') {
    return '';
  }
    const expectedLines = expected.split('\n');
    const otherLines = other.split('\n');

    // TODO:
    // - this should be cleanned up some
    // - Should use a better diff algo
    // - Probably just should use the unix one if possible
    //
    // TODO2:
    // - Instead of diffing here, we might just want to persist it to disk
    let diff = [];
    for (let i = 0; i < expectedLines.length; i++) {
      if (expectedLines[i] === otherLines[i]) {
        diff.push(`  ${expectedLines[i]}`);
      } else {
        diff.push(red(`- ${expectedLines[i]}`));
        if (i < otherLines.length) {
          diff.push(green(`+ ${otherLines[i]}`));
        }
      }
    }
    for (let i = expectedLines.length; i < otherLines.length; i++) {
      diff.push(green(`+ ${otherLines[i]}`));
    }

    return `Diff:

    ${withIndent(diff.join('\n'), indent)}
    `;
}

export class NotIdenticalError<T> extends BaseExpectationError {
  constructor(expected: T, other: T) {
    super(
`Expected values to be equal.
Expected:
${withIndent(formatValue(expected), '    │ ')}
Found:
${withIndent(formatValue(other), '    │ ')}
${diff(expected, other, '    ')}`);
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
