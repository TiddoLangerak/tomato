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

The tests can be executed directly. E.g. `node my-test.test.js`

## Option 2: run entire test suite

The `tomato` CLI executable can take a list of test files from stdin, and will then run them. E.g.:

```
find src/**/*.test.js | npx tomato
```

# How to run with source code transformations?
## Option 1: convert first

```
tsc && find lib/**/*.test.js | npx tomato
```

## Option 2: run with a loader (experimental)
```
find src/**/*.test.ts | NODE_OPTIONS="--loader ts-node/esm" tomato
```

# How to run in watch mode? (experimental)
Register the `loader` when running the tests, and run it with the `-w` flag
```
find src/**/*.test.js | NODE_OPTIONS="--loader @tomato/tomato/loader" tomato -w
```

## Source code transformations in watch mode
Essentially you just have to combine it with one of the above:

### 1. Run source code transformations separately
Terminal 1:
```
tsc -w
```
terminal 2:
```
find lib/**/*.test.js | node --loader tomato/loader tomato -w
```

### 2. Chain multiple loaders (Node >= 18.16.0)
```
find src/**/*.test.ts | NODE_OPTIONS="--loader ts-node/esm --loader @tomato/tomato/loader" tomato
```

Please note that the tomato-loader must be the **last** in the chain.

**Warning**: As of writing, the ts-node loader does not work on Node v20.0.0. See https://github.com/TypeStrong/ts-node/issues/1997.

## Caveats:
### Picking up new files
This won't pick up on newly added test files. Just restart the process for that.

### CommonJS modules
The watcher only picks up on ESM modules, not CommonJS modules.

# Configuration

The tool has very minimal configuration. At the moment, the only configuration is what we use as a diff tool for generating text diffs. The difftool can be configured with the environmental variable `DIFFTOOL`, and defaults to `git diff --color=always`. The difftool will get passed 2 file paths: the first is a path with the "expected" text, and the second with the "actual" text. Whatever output the difftool generates will be included in the test. Example:

```
DIFFTOOL=diff node my-test.test.js
```

----

# Design principles & considerations
## 1. No external dependencies.
I'm trying to keep this module as light-weight as possible, which means avoiding depending on external dependencies.

## 2. Modern JS first
E.g. prioritize support for ESM > CommonJS, etc.

## 3. Don't reinvent the wheel, follow the Unix philosophy and make it composable.
Whenever possible, we rely on open integration with other tools.
How we deal with files is a good example of this: instead of building in our own include/exclude files lists, we just take in a list of files to test on stdin. There are plenty of tools out there that can generate a list of files using glob patterns, regular expressions, or anything you want, and that will play nicely together with tomato.

## 4. No required 'peer' dependencies
No external libraries should be needed for the basic unit test experience.
That doesn't mean that we want to have all batteries included: we aim to provide a basic experience out-of-the-box, but for specific needs external libraries can be used.

## 5. Executable test files
The test files themselves are executable, it shouldn't be needed to run tests through a runner.
That said, the runner is still there for cross-cutting concerns.

## 5. Top-to-bottom
The tests execute from top to bottom, the tests are executed when their statements are encountered. (I.e. this is the opposite to frameworks like Jest, which first build up the test suite, and only then run it).


# TODO
- [ ] More assertions
- [ ] Properly compile to be usable in other projects
- [ ] Publish
- [ ] Self test
- [ ] Watch mode for CommonJS modules
- [ ] Ignore watches on node_modules
- [ ] Parallel execution
- [ ] Nested tests

# TODONT
## Special support for source code transformations
There are perfectly capable tools for that. This shouldn't be built into the test runner, just do this externally. (See principle #3)

## Support for file filters
Again, there are perfectly capable tools to generate the list of files to test. There's no need to add this into tomato. (See principle #3)

## beforeAll/setup
Since tests run top-to-bottom, this is simply not needed

# Maybe
## afterAll/teardown
Since tests run top-to-bottom, this is not strictly needed. However, I acknowledge that it might be useful to keep setup & teardown code close together, hence I'm considering adding support for this.

## beforeEach/afterEach
I'm unsure about this one. While it's a common use case to want a beforeEach/afterEach functionality, I'm not yet sure if we actually need special support for this. E.g. this could also be achieved like this:

```
const integrationTest = (testName, testFn) => test(testName, async () => {
  const db = await setupDb(); // "beforeEach"
  await testFn(db);
  await resetDb(db); // "afterEach"
});

integrationTest("My-integration-test", async(db) => {
  given("a user");
  createUser(db);

  when("validating their email");
  validateEmail(user);

  then("they become active");
  assert(user.isActive());
});
```

I'm unsure if I want to add special support for this, or if we can get away with patterns like the above.

## Global setup & teardown
Haven't given this too much thought yet.
