import { Awaitable, getCallerFile, preventParallelExecution } from "./util.js";
import { failures, successes } from "./summary.js";
import { reporter } from './reporter.js';
import { CleanupHook, currentContext, withContext } from "./context.js";

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
