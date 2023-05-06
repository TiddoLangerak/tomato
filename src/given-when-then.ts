import { green, red } from "./colors.js";
import { Awaitable, formatError, getCallerFile, preventParallelExecution, withIndent } from "./util.js";
import { failures, successes } from "./summary.js";
import { reporter } from './reporter.js';

type CleanupHook = () => Awaitable<unknown>;

// TODO next time:
// - Hook the context into the global scope
// - Then we can use it for reporting, nested tests, etc.
type Context = {
  parentContext: Context | null;
  ending: boolean;
  cleanupHooks: CleanupHook[];
}

let lastTestFile: string = '';
let isCleaning = false;
const cleanupHooks: (CleanupHook)[] = [];

let currentContext: Context = {
  parentContext: null,
  ending: false,
  cleanupHooks: []
};

async function cleanup(context: Context) {
  await Promise.allSettled(
    context.cleanupHooks.splice(0, Number.POSITIVE_INFINITY)
      .map(f => f())
  );
}

async function withContext(cb: (ctx: Context) => Awaitable<unknown>) {
  const parentContext = currentContext;
  currentContext = {
    parentContext,
    ending: false,
    cleanupHooks: []
  }

  try {
    await cb(currentContext);
  } finally {
    currentContext.ending = true;
    await cleanup(currentContext);
    currentContext = parentContext
  }
};

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
export const test = preventParallelExecution(
  "Cannot run multiple tests in parallel. Did you forget to `await` your test?",
  async function(description: string, fn: () => Awaitable<void>) {
    await withContext(async () => {
      const file = getCallerFile(test);

      await reporter.startExecution(file, description);
      try {
        await fn();
        await reporter.success();
        successes.push({ description, file });
      } catch (e) {
        await reporter.failure(e);
        failures.push({ description, file, error: e });
      }
    });
  }
);

export const Given = reporter.given;
export const When = reporter.when;
export const Then = reporter.then;
export const And = reporter.and;

export function onCleanup(cleanup: CleanupHook) {
  if (currentContext.ending) {
    throw new Error("Can't schedule cleanup hooks when the context is ending")
  }
  currentContext.cleanupHooks.push(cleanup);
}
