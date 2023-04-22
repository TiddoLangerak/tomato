import { green, red } from "./colors.js";
import util from 'util';

type Awaitable<T> = Promise<T> | T;

type Success = {
  description: string,
  file: string
}
type Failure = {
  description: string,
  error: any,
  file: string
};
const successes: Success[] = [];
const failures: Failure[] = [];

function getCallerFile(currentFunc: Function) {
  const cap: { stack: string } = { stack: ""};
  Error.captureStackTrace(cap, test);
  const caller = cap.stack.split("\n")[1].trim().substr('at '.length);
  const { pathname } = new URL(caller);
  const locationIndex = pathname.indexOf(':');
  return locationIndex === -1
    ? pathname
    : pathname.substr(0, pathname.indexOf(':'));
}

export async function test(description: string, fn: () => Awaitable<void>) {
  const file = getCallerFile(test);

  console.log(`File: ${file}`);
  console.log(`Test: ${description}`)
  try {
    await fn();
    console.log(green(`    Test succeeded`));
    successes.push({ description, file });
  } catch (e) {
    console.error(red(util.inspect(e).replaceAll(/^/mg, '       ')));
    console.log(red(`    Test failed`));
    failures.push({ description, file, error: e });
  }
  console.log("");
}

export function given(description: string) {
  console.log(`    given  ${description}`);
}

export function when(description: string) {
  console.log(`    when   ${description}`);
}

export function then(description: string) {
  console.log(`    then   ${description}`);
}

export function assert(res: boolean) {
  if (!res) {
    const err = new Error("Assertion failed");
    Error.captureStackTrace(err, assert);
    throw err;
  }
}

process.on('beforeExit', () => {
  if (successes.length || failures.length) {
    console.log("\n=============================\n");
    console.log("Summary:");
    console.log(`    Successes: ${successes.length}`);
    console.log(`    Failures: ${failures.length}`);
    console.log("");
    console.log("Tests failed:");
    for (const failure of failures) {
      console.log(`    File: ${failure.file}`);
      console.log(`    Test: ${failure.description}`);
      console.log(`    Failure:`);
      console.log(red(util.inspect(failure.error).replaceAll(/^/mg, '        ')));
      console.log("");
    }

  }
});
