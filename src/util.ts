import { fileURLToPath } from 'node:url';
import { red } from "./colors.js";
import util from 'util';

/**
 * Gets the full file path of the caller of the passed in function.
 */
export function getCallerFile(currentFunc: Function): string {
  const cap: { stack: string } = { stack: ""};
  Error.captureStackTrace(cap, currentFunc);
  const firstLine = cap.stack.split("\n")[1].trim().substring('at '.length);
  const caller = firstLine.match(/\((.*)\)/)?.[1] ?? firstLine;
  const file = fileURLToPath(caller);
  const locationIndex = file.indexOf(':');
  return locationIndex === -1
    ? file
    : file.substring(0, file.indexOf(':'));
}

export type Awaitable<T> = Promise<T> | T;


export function formatError(e: any): Awaitable<string> {
  if (e && typeof e === 'object' && 'displayError' in e && typeof e.displayError === 'function') {
    return e.displayError();
  } else {
    return red(util.inspect(e).replaceAll(/^/mg, '           '));
  }
}

export function withIndent(msg: string, indent: string): string {
  // Don't indent empty lines
  return msg.replaceAll(/^(?=.)/mg, indent);
}

export function formatValue(val: any): string {
  return typeof val === 'string' ? val : util.inspect(val);
}

export function preventParallelExecution<A extends any[], R>(msg: string, fn: (...args: A) => Awaitable<R>): (...args: A) => Promise<R> {
  let isRunning = false;
  return async (...args: A): Promise<R> => {
    if (isRunning) {
      throw new Error(msg);
    }
    isRunning = true;
    try {
      return await fn(...args);
    } finally {
      isRunning = false;
    }
  }
}
