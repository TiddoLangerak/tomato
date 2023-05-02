import { Awaitable, formatValue, withIndent } from "./util.js";
import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run } from "./process.js";

export type ExpectationError = {
  displayError: () => Awaitable<string>;
};

export class BaseExpectationError extends Error {
  constructor(protected msg: string) { super(msg); }
  displayError = () => this.msg;
}

// TODO: default diff tool
const difftool = process.env.DIFFTOOL || 'git diff --color=always';

async function diff<T>(expected: T, actual: T) {
  if (typeof expected !== 'string' || typeof actual !== 'string') {
    return '';
  }

  const dir = await fs.mkdtemp(join(tmpdir(), 'tomato-'))
  const expectedFile = join(dir, `expected`);
  const actualFile = join(dir, `actual`);
  await Promise.all([
    fs.writeFile(expectedFile, expected),
    fs.writeFile(actualFile, actual)
  ]);

  const { outputs } = await run('/bin/bash', ["-c", `${difftool} ${expectedFile} ${actualFile}`]);
  // In theory, we could do a rm -rf, but that's risky in the presence of potential bugs.
  // If somehow `dir` gets corrupted, I don't want to risk removing non test files.
  // Since it's just 2 files and a folder, we can remove it by hand
  await Promise.all([
    fs.unlink(expectedFile),
    fs.unlink(actualFile),
  ]);
  await fs.rmdir(dir);
  const output = outputs.map(({ value }) => value).join('');
  return output;
}

export class NotIdenticalError<T> extends Error implements ExpectationError {
  msgWithDiff: Promise<string>;
  constructor(expected: T, other: T) {
    super(
`Expected values to be equal.
Expected:
${withIndent(formatValue(expected), '    │ ')}
Found:
${withIndent(formatValue(other), '    │ ')}`);
  this.msgWithDiff = diff(expected, other)
    .then(diff => {
      if (diff) {
        return `${this.message}\nDiff command output:\n${withIndent(diff, '    │ ')}`;
      } else {
        return `${this.message}\n`;
      }
    });
  }
  displayError = () => this.msgWithDiff;
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
