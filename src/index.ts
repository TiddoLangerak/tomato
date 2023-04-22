import { green, red } from "./colors.js";
import util from 'util';
import { fileURLToPath } from 'node:url';
import path from 'path';
import fs from 'fs/promises';


type Awaitable<T> = Promise<T> | T;

type Success = {
  description: string,
  file: string
}
type Failure = {
  description: string,
  error: any,
  file: string
};
const successes: Success[] = [];
const failures: Failure[] = [];

function getCallerFile(currentFunc: Function) {
  const cap: { stack: string } = { stack: ""};
  Error.captureStackTrace(cap, currentFunc);
  const caller = cap.stack.split("\n")[1].trim().substring('at '.length);
  const file = fileURLToPath(caller);
  const locationIndex = file.indexOf(':');
  return locationIndex === -1
    ? file
    : file.substring(0, file.indexOf(':'));
}

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

export function assert(res: boolean) {
  if (!res) {
    const err = new Error("Assertion failed");
    Error.captureStackTrace(err, assert);
    throw err;
  }
}

process.on('beforeExit', () => {
  let lastFile: string = "";
  if (successes.length || failures.length) {
    console.log("\n=============================\n");
    console.log("Summary:");
    console.log(`    Successes: ${successes.length}`);
    console.log(`    Failures: ${failures.length}`);
    console.log("");
    console.log("Tests failed:");
    for (const failure of failures) {
      if (failure.file !== lastFile) {
        console.log(`    File: ${failure.file}`);
        console.log("");
      }
      lastFile = failure.file;
      console.log(`        Test: ${failure.description}`);
      console.log(`        Failure:`);
      console.log(red(util.inspect(failure.error).replaceAll(/^/mg, '            ')));
      console.log("");
    }

  }
});

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFile) {
  runAll();
}


async function runAll() {
  const chunks = [];

  if (process.stdin.isTTY) {
    console.log("Please enter the paths to your test files separated by whitespace, and then end with an EOF (ctrl+d)");
    console.warn("You likely intended to pass in test files from stdin, such as:")
    console.log("find *.test.ts | tomato");

  }

  process.stdin.on('readable', () => {
    let chunk;
    while (null !== (chunk = process.stdin.read())) {
      chunks.push(chunk);
    }
  });

  process.stdin.on('end', async () => {
    const content = chunks.join('');
    const testFiles = new Set(content.split('\n')
      .map(f => f.trim())
      .filter(f => f)
      .map(f => path.resolve(process.cwd(), f)));
    for (const file of testFiles) {
      await import(file);
    }
    // TODO: fix when we trigger the summary


    const watchedFiles: Set<string> = new Set();
    function addWatchers(files: Set<string>) {
      [...files]
        .filter(file => !watchedFiles.has(file))
        .forEach(async file => {
          console.log(`watching ${file}`);
          watchedFiles.add(file);
          // TODO: add signal for cancelling
          for await (const event of fs.watch(file)) {
            fileChanged(file);
          }
        });
    }

    const changed: Set<string> = new Set();
    let msgTimeout = null;
    function fileChanged(file) {
      console.log("File changed", file);
      changed.add(file);
      clearTimeout(msgTimeout);
      msgTimeout = setTimeout(() => {
        console.log("Getting all affected for", changed);
        globalThis.__tomato_port.postMessage({
          type: 'getAllAffected',
          files: [...changed]
        });
        changed.clear();
      }, 500);
    }

    globalThis.__tomato_port.postMessage({
      type: 'getAllDependencies',
      files: [...testFiles]
    });
    globalThis.__tomato_port.on('message', async (evt) => {
      switch (evt.type) {
        case 'dependencies':
          console.log("Received dependencies", evt.deps);
          addWatchers(evt.deps);
          break;
        case 'affected':
          console.log("Received affected", evt.affected);
          const retest = [...evt.affected]
            .filter(f => testFiles.has(f));
          console.log('Retesting', retest);
          // TODO:
          // - Move this out
          // - Start watchers again where needed
          for (const f of retest) {
            await import(f + `?${Date.now()}`);
          }
          break;
        default:
          console.error(`Unknown message ${evt.type}`);
      }
    });
    //globalThis.__tomato_port.unref();
    return;

  });
}
