import { MappedAwaitable, Unpromise, maybeAsync } from "./async.js";
import { Result } from "./result.js";
import { Awaitable } from "./util.js";

/**
 * Runs a failable function and return it's result as a tuple.
 */
export function run<T>(f: () => T): Result<T, any> {
  try {
    const val = f();
    return {val};
  } catch (err) {
    return {err};
  }
}

export async function runAsync<T>(f: () => Awaitable<T>): Promise<Result<T, any>> {
  try {
    const val = await f();
    return {val};
  } catch (err) {
    return {err};
  }
}
