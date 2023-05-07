import { test, Given, When, Then, expect, And } from '@tomato/tomato-prev';
import path from 'node:path';
import { runWithRunner, runWithWatcher } from './test/runner.js';
import { getDirname } from './module.js';
import { green } from './colors.js';
import fs from 'node:fs/promises';
const __dirname = getDirname(import.meta.url);

// TODO next time:
//
// Start writing tests here, both for watch and runner mode
// First thing we can test is the onCleanup hook
//
// Need to figure out how to run it, since the runner needs real files.
// Possibly we can create the test files for real somewhere in a test folder or something like that

await test('test with top-level cleanup', async () => {
  Given("a test with a top-level cleanup");

  const testFilePath = path.join(__dirname, '/test/files/test_with_cleanup.ts');

  When("running the test");

  const { output } = await runWithRunner([testFilePath]);

  Then("The cleanup hook is run once at the end of all tests");

  expect(output).toBe(
`out:File: /home/tiddo/repos/tomato/src/test/files/test_with_cleanup.ts
out:
out:    Test: Test 1
out:
out:           ${green("Test succeeded")}
out:
out:    Test: Test 2
out:
out:           ${green("Test succeeded")}
out:
out:On cleanup
out:══════════════════════════════
out:
out:Summary:
out:    Successes: 2
out:    Failures: 0
out:
out:══════════════════════════════
`
  );

});

await test('multiple tests files with top-level cleanup', async () => {
  Given("2 test files with top-level cleanups");

  const testFilePath1 = path.join(__dirname, '/test/files/test_with_cleanup.ts');
  const testFilePath2 = path.join(__dirname, '/test/files/test_with_cleanup_2.ts');

  When("running the tests");

  const { output } = await runWithRunner([testFilePath1, testFilePath2]);

  Then("The cleanup hooks are run at the end of their test file");

  expect(output).toBe(
`out:File: /home/tiddo/repos/tomato/src/test/files/test_with_cleanup.ts
out:
out:    Test: Test 1
out:
out:           ${green("Test succeeded")}
out:
out:    Test: Test 2
out:
out:           ${green("Test succeeded")}
out:
out:On cleanup
out:File: /home/tiddo/repos/tomato/src/test/files/test_with_cleanup_2.ts
out:
out:    Test: Test 1
out:
out:           ${green("Test succeeded")}
out:
out:    Test: Test 2
out:
out:           ${green("Test succeeded")}
out:
out:On cleanup 2
out:══════════════════════════════
out:
out:Summary:
out:    Successes: 4
out:    Failures: 0
out:
out:══════════════════════════════
`
  );
});

await test('test with top-level cleanup in watch mode', async () => {
  Given("a test with a top-level cleanup");

  const testFilePath = path.join(__dirname, '/test/files/test_with_cleanup.ts');

  When("running the test in watch mode");

  const ac = new AbortController();
  const run = runWithWatcher([testFilePath], ac.signal);
  // TODO: we should make this deterministic
  // To do so, we'd need to hook into the output stream while the command is still running.
  await new Promise(resolve => setTimeout(resolve, 1000));

  And("touching the file")

  await touchFile(testFilePath);

  await new Promise(resolve => setTimeout(resolve, 1000));

  Then("The cleanup hook is run once at the end of each run");

  ac.abort();
  const { output } = await run;

  expect(output).toBe(
`out:File: /home/tiddo/repos/tomato/src/test/files/test_with_cleanup.ts
out:
out:    Test: Test 1
out:
out:           ${green("Test succeeded")}
out:
out:    Test: Test 2
out:
out:           ${green("Test succeeded")}
out:
out:On cleanup
out:══════════════════════════════
out:
out:Summary:
out:    Successes: 2
out:    Failures: 0
out:
out:══════════════════════════════
out:Files changed, rerunning affected tests
out:
out:    Test: Test 1
out:
out:           ${green("Test succeeded")}
out:
out:    Test: Test 2
out:
out:           ${green("Test succeeded")}
out:
out:On cleanup
out:══════════════════════════════
out:
out:Summary:
out:    Successes: 2
out:    Failures: 0
out:
out:══════════════════════════════
`
  );

});

async function touchFile(filePath: string) {
  const now = new Date();
  await fs.utimes(filePath, now, now);
}
