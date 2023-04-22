import { green, red } from "./colors.js";
import util from 'util';
import { Awaitable, getCallerFile } from "./util.js";
import { failures, successes } from "./summary.js";

let lastTestFile: string = '';

export async function test(description: string, fn: () => Awaitable<void>) {
  const file = getCallerFile(test);

  if (file !== lastTestFile) {
    console.log(`File: ${file}`);
    console.log("");
  }
  lastTestFile = file;
  console.log(`    Test: ${description}`)
  try {
    await fn();
    console.log(green(`        Test succeeded`));
    successes.push({ description, file });
  } catch (e) {
    console.error(red(util.inspect(e).replaceAll(/^/mg, '           ')));
    console.log(red(`        Test failed`));
    failures.push({ description, file, error: e });
  }
  console.log("");
}

export function given(description: string) {
  console.log(`    given  ${description}`);
}

export function when(description: string) {
  console.log(`    when   ${description}`);
}

export function then(description: string) {
  // TODO: figure this out.
  // It seems that ts-node-esm calls module.then, to resolve the promise or something
  if (typeof description === 'function') {
    return;
  }
  console.log(`    then   ${description}`);
}
