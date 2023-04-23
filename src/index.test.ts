import { test, given, when, then, expect, and } from '@tomato/tomato';
import { spawn } from 'node:child_process';
import { green } from './colors.js';
import { fileURLToPath } from 'node:url';
import {dirname} from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// TODO:
// - Add more tests here
// - Consider making the keywords all-caps (e.g. GIVEN WHEN THEN)
// - Consider making the output all caps
// - Styling of the output
await test('successful test', async () => {
  given("a successful test");

  const myTest = `
    test("My test", () => {
      given("two numbers");

      const a = 1;
      const b = 2;

      when("adding the numbers");

      const sum = a + b;

      then("the sum is correct");

      expect(sum).toBe(3);
    });
  `;

  when('executing the test');

  const { stdout, stderr, code } = await runTest(myTest);

  then('the process exits with code 0');

  expect(code).toBe(0);

  and('the output is as expected');

  expect(stdout).toBe(
`File: ${__dirname}/[eval1]

    Test: My test

    Given  two numbers
    When   adding the numbers
    Then   the sum is correct
           ${green("Test succeeded")}

══════════════════════════════

Summary:
    Successes: 1
    Failures: 0

══════════════════════════════
`
  );
});

async function runTest(test: string) {
  const testFile = `
  import { test, given, when, then, expect } from './index.js';

  ${test}
  `;


  const childProcess = spawn('node', ['--loader', 'ts-node/esm', '--no-warnings', '--input-type', 'module'], { cwd: __dirname });
  await new Promise<void>((resolve, reject) => {
    childProcess.stdin.write(testFile, (err) => {
      err ? reject(err): resolve();
    });
  });

  await new Promise<void>((resolve, reject) => childProcess.stdin.end(() => resolve()));

  let stdout = "";
  let stderr = "";
  childProcess.stdout.on('data', (data) => {
    stdout += data;
  });

  childProcess.stderr.on('data', (data) => {
    stderr += data;
  });

  const code = await new Promise<number | null>((resolve) => {
    childProcess.on('close', (code) => resolve(code));
  });

  return { stdout, stderr, code };

}

