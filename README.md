# What is tomato?

It's a test runner, based on cucumber test syntax.

# Why?

I think the "given-when-then" approach of writing tests is superior to "test()" or "describe()/it()" style tests.
Well written tests in other frameworks already implicitly follow a given-when-then approach,
so it only makes sense to build it as a core part of the framework.

# How to write tests

See `index.test.ts` for example

# How to run
## Option 1: run any test file individually

The tests can be executed directly. E.g. `node my-test.test.ts`

## Option 2: run entire test suite

The `tomato` CLI executable can take a list of test files from stdin, and will then run them. E.g.:

```
find src/**/*.test.js | npx tomato
```

# How to run with source code transformations?
## Option 1: convert first

```
tsc;
find lib/**/*.test.js | npx tomato
```

## Option 2 (typescript specific): run with ts-node
TODO: I think this can be generalized. IIRC, node nowadays supports module loaders that transform stuff.
```
find src/**/*.test.ts | npx ts-node-esm tomato
```

# How to run in watch mode?
Not implemented
