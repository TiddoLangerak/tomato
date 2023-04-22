import path from 'path';
import fs from 'fs/promises';
import { printAndResetSummary } from './summary.js';

const testFiles = new Set();
const watchMode = process.argv[2] === '-w';


export async function runAll() {
  const chunks: string[] = [];

  if (process.stdin.isTTY) {
    console.log("Please enter the paths to your test files separated by whitespace, and then end with an EOF (ctrl+d)");
    console.warn("You likely intended to pass in test files from stdin, such as:")
    console.log("find *.test.ts | tomato");

  }

  if (watchMode) {
    setupLoaderListener();
  }

  process.stdin.on('readable', () => {
    let chunk: string | null;
    while (null !== (chunk = process.stdin.read())) {
      chunks.push(chunk);
    }
  });

  process.stdin.on('end', async () => {
    const content = chunks.join('');
    const files = new Set(content.split('\n')
      .map(f => f.trim())
      .filter(f => f)
      .map(f => path.resolve(process.cwd(), f)));

    runTests(files);
  });
}

function setupLoaderListener() {
  if (!globalThis.__tomato_port) {
    console.error("Watchmode needs the tomato watcher set up");
    process.exit(1);
  }
  globalThis.__tomato_port.on('message', async (evt) => {
    switch (evt.type) {
      case 'dependencies':
        debugLog("Received dependencies", evt.deps);
        addWatchers(evt.deps);
        break;
      case 'affected':
        debugLog("Received affected", evt.affected);

        const retest = [...evt.affected]
          .filter(f => testFiles.has(f));

        if (retest.length) {
          console.log(`Files changed, rerunning affected tests`);
          console.log("");
          runTests(retest);
        }

        break;
      default:
        debugLog(`Unknown message ${evt.type}`);
    }
  });
}

async function runTests(files: Iterable<string>) {
  // TODO: probably needs some extra logic here to make sure only 1 run at a time is triggered
  [...files].forEach(f => testFiles.add(f));
  for (const file of files) {
    await import(`${file}?_tomato=${Date.now()}`);
  }

  printAndResetSummary();

  if (watchMode) {
    globalThis.__tomato_port.postMessage({
      type: 'getAllDependencies',
      files: [...files]
    });
  }
}

const watchedFiles: Set<string> = new Set();
function addWatchers(files: Iterable<string>) {
  [...files]
    .filter(file => !watchedFiles.has(file))
    .forEach(async file => {
      debugLog(`watching ${file}`);
      watchedFiles.add(file);
      for await (const event of fs.watch(file)) {
        fileChanged(file);
      }
    });
}

const changed: Set<string> = new Set();
let retestTimeout = null;
function fileChanged(file) {
  debugLog("File changed", file);
  changed.add(file);

  clearTimeout(retestTimeout);
  retestTimeout = setTimeout(() => {
    debugLog("Getting all affected for", changed);
    globalThis.__tomato_port.postMessage({
      type: 'getAllAffected',
      files: [...changed]
    });
    changed.clear();
  }, 500);
}


function debugLog(...args: any[]) {
  return;
  console.log(...args);
}
