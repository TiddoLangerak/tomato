export function assert(res: boolean) {
  if (!res) {
    const err = new Error("Assertion failed");
    Error.captureStackTrace(err, assert);
    throw err;
  }
}
