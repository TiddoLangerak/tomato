import path from 'path';
import fs from 'fs/promises';
import { printAndResetSummary } from './summary.js';
import { fileURLToPath } from 'node:url';

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
    setupLoaderComms();
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

    await runTests(files);
  });
}

declare global {
  var __tomato_port: MessagePort | undefined;
}

function setupLoaderComms() {
  if (!globalThis.__tomato_port) {
    console.error("Watchmode needs the tomato watcher set up");
    process.exit(1);
  }
  globalThis.__tomato_port.postMessage({ type: 'addIgnoreFile',
    file: fileURLToPath(import.meta.url)
  });
  globalThis.__tomato_port.onmessage = async (evt: MessageEvent) => {
    const { data } = evt;
    switch (data.type) {
      case 'dependencies':
        debugLog("Received dependencies", data.deps);
        addWatchers(data.deps);
        break;
      case 'affected':
        debugLog("Received affected", data.affected);

        const retest = [...data.affected]
          .filter(f => testFiles.has(f));

        if (retest.length) {
          console.log(`Files changed, rerunning affected tests`);
          console.log("");
          await runTests(retest);
        }

        break;
      default:
        debugLog(`Unknown message ${data.type}`);
    }
  };
}

async function runTests(files: Iterable<string>) {
  // TODO: probably needs some extra logic here to make sure only 1 run at a time is triggered
  [...files].forEach(f => testFiles.add(f));
  for (const file of files) {
    try {
      await import(`${file}?_tomato=${Date.now()}`);
    } catch(e) {
      console.error(`Failed running file ${file}`, e);
    }
  }

  printAndResetSummary();

  if (watchMode) {
    globalThis.__tomato_port?.postMessage({
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
let retestTimeout: NodeJS.Timeout | null = null;
function fileChanged(file: string) {
  debugLog("File changed", file);
  changed.add(file);

  retestTimeout && clearTimeout(retestTimeout);
  retestTimeout = setTimeout(() => {
    debugLog("Getting all affected for", changed);
    globalThis.__tomato_port?.postMessage({
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
