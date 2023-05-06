// TODO: better naming
// Make this work. Probably not.

import { Awaitable } from "./util.js";

export type Unpromise<T> = T extends Promise<infer V> ? Unpromise<V> : T;

/**
 * Preserves the promise-ness of the input.
 * I.e. if the input is a promise, then so is the output.
 * If the input is not a promise, then the output is whatever the output is (promise or not)
 */
export type MappedAwaitable<I, O> = I extends Promise<any>
  ? Awaitable<Unpromise<O>>
  : O;


export type MaybeAsync<T> = {
  // TODO: add error callback
  then: <T2>(mapFn: (val: Unpromise<T>) => T2) => MaybeAsync<MappedAwaitable<T, T2>>,
  catch: <T2>(mapFn: (val: any) => T2) => MaybeAsync<T> | MaybeAsync<MappedAwaitable<T, T2>>,
  return: () => T;
}

export function maybeAsync<T>(val: T): MaybeAsync<T> {
  /*
  return {
    then: <T2>(mapFn: (val: Unpromise<T>) => T2) => {
      if (val instanceof Promise) {
        const res = val.then(mapFn);
        return maybeAsync(res);
      } else {
        const res = mapFn(val as Unpromise<T>);
        return maybeAsync(res);
      }
    },
    return: () => val
  }*/
 // TODO: deal with errors
  if (val instanceof Promise) {
    return {
      // CAST:
      // - When we get here, then `val instanceof Promise`.
      // - This also means that `T = Promise<X> | Y` (Y !== promise)
      // - With distributed unions, we now get:
      // - MappedAwaitable<T, T2> = MappedAwaitable<Promise<X>, T2> | MappedAwaitable<Y, T2>
      //   = Awaitable<Unpromise<T2>> | T2
      //   = Promise<Unpromise<T2>> | Unpromise<T2> | T2
      // - `val.then(mapFn)` resolves to `Promise<Unpromise<T2>>`* (not according to TS, but effectively it does)
      // - Hence, `val.then(mapFn)` is of type `MappedAwaitable<T, T2>`
      //
      // Unfortunately, TS can't prove this itself, and we need an unsafe cast.
      then: <T2>(mapFn: (val: Unpromise<T>) => T2) => maybeAsync(val.then(mapFn) as MappedAwaitable<T, T2>),
      catch: <T2>(mapFn: (err: any) => T2) => maybeAsync(val.catch(mapFn) as (MappedAwaitable<T, T2> | T)),
      return: () => val
    }
  } else {
    const self: MaybeAsync<T> = {
      // CAST:
      // 1. val as Unpromise<T>
      //    - We know that val is not a Promise
      //    - For non-promises, `Unpromise<T> === T`
      //    - Hence, val is a subtype of `Unpromise<T>`
      //      (This works even for composite types:
      //        Suppose T = number | Promise<number>, val = 3
      //        Now Unpromise<T> = Unpromise<number | Promise<number>> = number | number = number
      //        Hence, val is of type Unpromise<number> )
      // 2. mapFn() as MappedAwaitable<T, T2>
      //    the return type of mapfn(val) is T2.
      //    We now need to prove that T2 extends MappedAwaitable<T, T2>
      //
      //    We know that val is not a promise, but that doesn't tell anything about T. E.g. T might be `number | Promise<number>`
      //    So we still need to consider that `T = Promise<X> | Y`
      //    Above we already derived that we then get `MappedAwaitable<T, T2> = Awaitable<Unpromise<T2>> | T2`
      //
      //    This contains T2, hence `mapfn(val)` is a valid subtype of this.
      then: <T2>(mapFn: (val: Unpromise<T>) => T2) => maybeAsync(mapFn(val as Unpromise<T>) as MappedAwaitable<T, T2>),
      catch: () => self,
      return: () => val
    };
    return self;
  }
}
