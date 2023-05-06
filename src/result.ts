export type Result<T, E> = { val : T, err?: never } | { err: E, val?: never };
