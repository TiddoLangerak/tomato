import { test, Given, When, Then, expect, And } from '@tomato/tomato-prev';
import { spawn } from 'node:child_process';
import { green, red } from './colors.js';
import { fileURLToPath } from 'node:url';
import {dirname} from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// TODO:
// - Add more tests here
// - Styling of the output
await test('successful test', async () => {
  Given("a successful test");

  const myTest = `
    test("My test", () => {
      Given("two numbers");

      const a = 1;
      const b = 2;

      When("adding the numbers");

      const sum = a + b;

      Then("the sum is correct");

      expect(sum).toBe(3);
    });
  `;

  When('executing the test');

  const { code, output } = await runTest(myTest);

  Then('the process exits with code 0');

  expect(code).toBe(0);

  And('the output is as expected');

  expect(output).toBe(
`out:File: ${__dirname}/[eval1]
out:
out:    Test: My test
out:
out:    Given  two numbers
out:    When   adding the numbers
out:    Then   the sum is correct
out:           ${green("Test succeeded")}
out:
out:══════════════════════════════
out:
out:Summary:
out:    Successes: 1
out:    Failures: 0
out:
out:══════════════════════════════
`
  );
});

await test('Failing test', async () => {
  Given('A failed test');
  const myTest = `
    test("My test", () => {
      Given("two numbers");

      const a = 1;
      const b = 2;

      When("adding the numbers");

      const sum = a + b;

      Then("the sum is correct");

      expect(sum).toBe(4);
    });
  `;

  When('executing the test');

  const { output, code } = await runTest(myTest);

  Then('the process exits with code 0');

  expect(code).toBe(0);

  And('the output is as expected');

  expect(output).toBe(
`out:File: ${__dirname}/[eval1]
out:
out:    Test: My test
out:
out:    Given  two numbers
out:    When   adding the numbers
out:    Then   the sum is correct
err:           ${red("Test failed")}
err:           Expected values to be equal.
err:           Expected:
err:               │ 4
err:           Found:
err:               │ 3
err:
out:
out:══════════════════════════════
out:
out:Summary:
out:    Successes: 0
out:    Failures: 1
out:
err:Tests failed:
err:    File: /home/tiddo/repos/tomato/src/[eval1]
err:
err:        Test: My test
err:        Failure:
err:            Expected values to be equal.
err:            Expected:
err:                │ 4
err:            Found:
err:                │ 3
err:
out:══════════════════════════════
`
  );

});

async function runTest(test: string) {
  const testFile = `
  import { test, Given, When, Then, expect } from './index.js';

  ${test}
  `;

  const childProcess = spawn('node', ['--loader', 'ts-node/esm', '--no-warnings', '--input-type', 'module'], { cwd: __dirname, env: { ...process.env, NODE_OPTIONS: undefined } });
  await new Promise<void>((resolve, reject) => {
    childProcess.stdin.write(testFile, (err) => {
      err ? reject(err): resolve();
    });
  });

  await new Promise<void>((resolve, reject) => childProcess.stdin.end(() => resolve()));

  let stdout = "";
  let stderr = "";
  let outputs: { type: string, value:string}[] = [];
  function addToOutput(type: string, value: string | Buffer) {
    const last = outputs.at(-1);
    if (last?.type === type) {
      last.value += value;
    } else {
      outputs.push({ type, value: value.toString() });
    }

  }
  childProcess.stdout.on('data', (data) => {
    stdout += data;
    addToOutput('out', data);
  });

  childProcess.stderr.on('data', (data) => {
    stderr += data;
    addToOutput('err', data);
  });

  const code = await new Promise<number | null>((resolve) => {
    childProcess.on('close', (code) => resolve(code));
  });

  const output = outputs
    .map(({ type, value }) => `${type}:` + value.toString().replaceAll(/\n(?!$)/g, `\n${type}:`))
    .join('');

  return { stdout, stderr, output, code };

}

