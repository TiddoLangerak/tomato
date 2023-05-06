import { Awaitable, getCallerFile, preventParallelExecution, withIndent } from "./util.js";
import { failures, successes } from "./summary.js";
import { reporter } from './reporter.js';
import { CleanupHook, currentContext, withContext } from "./context.js";


// TODO:
// Find something for how to make this a little better.
// It's now easy to forget to await tests, especially if the tests themselves aren't async
//
// There's a few things we could do:
// 1. Not require await if the test isn't async.
// 2. Allow interweaving of tests - but this requires capturing logs, and might turn out to be noisy
// 3. Auto-queue tests - but this breaks the top-to-bottom principle
// 4. Detect when tests interleave, and error when that happens (DONE)
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
  if (!currentContext) {
    throw new Error("Cannot schedule cleanup after tests have ended");
  }
  currentContext.addCleanupHook(cleanup);
}
