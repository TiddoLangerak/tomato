import { green, red } from "./colors.js";
import { Awaitable, formatError, withIndent } from "./util.js";

// TODO:
// For more complex reporters it would be very helpful if there's some top-level bookkeeping involved.
type Reporter = {
  startExecution(file: string, description: string): Awaitable<void>;
  success(): Awaitable<void>;
  failure(error: any): Awaitable<void>;
  given(description: string): Awaitable<void>;
  when(description: string): Awaitable<void>;
  then(description: string): Awaitable<void>;
  and(description: string): Awaitable<void>;
}

let lastTestFile: string | null = null;
const ConsoleReporter: Reporter = {
  startExecution(file: string, description: string) {
    if (file !== lastTestFile) {
      console.log(`File: ${file}`);
      console.log("");
    }
    lastTestFile = file;
    console.log(`    Test: ${description}`)
    console.log("");
  },
  success() {
    console.log(`           ${green("Test succeeded")}`);
    console.log("");
  },
  async failure(e: any) {
    console.error(`           ${red("Test failed")}`);
    console.error(withIndent(await formatError(e), '           '));
    console.log("");
  },
  given(description: string) {
    console.log(`    Given  ${description}`);
  },
  when(description: string) {
    console.log(`    When   ${description}`);
  },
  then(description: string) {
    console.log(`    Then   ${description}`);
  },
  and(description: string) {
    console.log(`    And    ${description}`);
  }
};

const NoopReporter: Reporter = {
  startExecution(){},
  success(){},
  failure(){},
  given(){},
  when(){},
  then(){},
  and(){},
}

export let reporter = ConsoleReporter;

export function setReporter(newReporter: Reporter) {
  reporter = newReporter;
}

export const reporters = {
  console: ConsoleReporter,
  noop: NoopReporter
};
