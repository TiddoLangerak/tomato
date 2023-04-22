import { fileURLToPath } from 'node:url';

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

