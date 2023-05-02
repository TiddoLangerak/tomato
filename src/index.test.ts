import { test, Given, When, Then, expect, And } from '@tomato/tomato-prev';
//import { test, Given, When, Then, expect, And } from './index.js';
import { green, red } from './colors.js';
import { fileURLToPath } from 'node:url';
import {dirname} from 'node:path';
import { run } from './process.js';

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

  const { exitCode, output } = await runTest(myTest);

  Then('the output is as expected');

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

  And('the process exits with code 0');

  expect(exitCode).toBe(0);

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

  const { output, exitCode } = await runTest(myTest);

  Then('the output is as expected');

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

  And('the process exits with code 0');

  expect(exitCode).toBe(0);

});

async function runTest(test: string) {
  const testFile = `
  import { test, Given, When, Then, expect } from './index.js';

  ${test}
  `;


  const { outputs, stderr, stdout, exitCode} = await run(
    'node',
    ['--loader', 'ts-node/esm', '--no-warnings', '--input-type', 'module'],
    { cwd: __dirname, env: { ...process.env, NODE_OPTIONS: undefined } },
    testFile
  );

  const output = outputs
    .map(({ type, value }) => `${type}:` + value.toString().replaceAll(/\n(?!$)/g, `\n${type}:`))
    .join('');

  return { stdout, stderr, output, exitCode };
}

