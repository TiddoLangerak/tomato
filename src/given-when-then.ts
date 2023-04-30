import { green, red } from "./colors.js";
import { Awaitable, formatError, getCallerFile, withIndent } from "./util.js";
import { failures, successes } from "./summary.js";

let lastTestFile: string = '';

// TODO:
// Find something for how to make this a little better.
// It's now easy to forget to await tests, especially if the tests themselves aren't async
//
// There's a few things we could do:
// 1. Not require await if the test isn't async.
// 2. Allow interweaving of tests - but this requires capturing logs, and might turn out to be noisy
// 3. Auto-queue tests - but this breaks the top-to-bottom principle
// 4. Detect when tests interleave, and error when that happens
//
// Probably a combination of 1 & 4 would make most sense
// TODO 2:
// - Perhaps description should be optional?
export async function test(description: string, fn: () => Awaitable<void>) {
  const file = getCallerFile(test);

  if (file !== lastTestFile) {
    console.log(`File: ${file}`);
    console.log("");
  }
  lastTestFile = file;
  console.log(`    Test: ${description}`)
  console.log("");
  try {
    await fn();
    console.log(`           ${green("Test succeeded")}`);
    successes.push({ description, file });
  } catch (e) {
    console.error(`           ${red("Test failed")}`);
    console.error(withIndent(formatError(e), '           '));
    failures.push({ description, file, error: e });
  }
  console.log("");
}

export function Given(description: string) {
  console.log(`    Given  ${description}`);
}

export function When(description: string) {
  console.log(`    When   ${description}`);
}

export function Then(description: string) {
  // TODO: figure this out.
  // It seems that ts-node-esm calls module.then, to resolve the promise or something
  if (typeof description === 'function') {
    return;
  }
  console.log(`    Then   ${description}`);
}

export function And(description: string) {
  console.log(`    And    ${description}`);
}
