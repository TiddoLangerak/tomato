import { Awaitable } from "./util.js";

export type CleanupHook = () => Awaitable<unknown>;
// TODO next time:
// - Test the global & file specific contexts
// - Hook the context into the global scope
// - Then we can use it for reporting, nested tests, etc.
export class Context {
  private parentContext: Context | null = null;
  private ending: boolean = false;
  private cleanupHooks: CleanupHook[] = [];

  public createSubContext() {
    const newContext = new Context();
    newContext.parentContext = this;
    return newContext;
  }

  public addCleanupHook(hook: CleanupHook) {
    if (this.ending) {
      throw new Error("Can't schedule cleanup hooks when the context is ending")
    }
    this.cleanupHooks.push(hook);
  }

  public async end() {
    this.ending = true;
    await Promise.allSettled(
      this.cleanupHooks.splice(0, Number.POSITIVE_INFINITY)
      .map(f => f())
    );
    return this.parentContext;
  }
}

export let currentContext: Context | null = new Context();

export async function withContext(cb: (ctx: Context) => Awaitable<unknown>) {
  currentContext = currentContext?.createSubContext() ?? new Context();

  try {
    await cb(currentContext);
  } finally {
    currentContext = await currentContext.end();
  }
};

