import { fileURLToPath } from 'node:url';
import { red } from "./colors.js";
import util from 'util';

/**
 * Gets the full file path of the caller of the passed in function.
 */
export function getCallerFile(currentFunc: Function): string {
  const cap: { stack: string } = { stack: ""};
  Error.captureStackTrace(cap, currentFunc);
  const caller = cap.stack.split("\n")[1].trim().substring('at '.length);
  const file = fileURLToPath(caller);
  const locationIndex = file.indexOf(':');
  return locationIndex === -1
    ? file
    : file.substring(0, file.indexOf(':'));
}

export type Awaitable<T> = Promise<T> | T;


export function formatError(e: any): string {
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
