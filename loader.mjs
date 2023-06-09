import { fileURLToPath } from 'node:url';

const dependencies = {};
const dependants = {};

function debugLog(...args) {
  return;
  console.log(...args);
}

const ignore = [];

export async function resolve(specifier, context, nextResolve) {
  const { parentURL = null } = context;


  const res = await nextResolve(specifier, context);
  // Skip node modules, don't care
  if (parentURL && res.url.startsWith('file:/')) {
    const parent = fileURLToPath(parentURL);
    const url = fileURLToPath(res.url);
    dependants[url] = dependants[url] ?? new Set();
    dependants[url].add(parent);
    dependencies[parent] = dependencies[parent] ?? new Set();
    dependencies[parent].add(url);
  }

  return res;
}

function findChildren(start, tree, acc = new Set()) {
  acc.add(start);
  for (const f of tree[start] ?? []) {
    if (!acc.has(f) && !ignore.includes(f)) {
      acc.add(f);
      findChildren(f, tree, acc);
    }
  }
  return acc;
}

function findChildrenBulk(starts, tree) {
  return starts
    .reduce((acc, file) => {
      return findChildren(file, tree, acc);
    }, new Set())
}

export function globalPreload({ port }) {
  port.onmessage = (evt) => {
    const data = evt.data;
    switch (data.type) {
      case 'getAllAffected':
        debugLog("Getting all affected for", data.files, dependants);
        const affected = findChildrenBulk(data.files, dependants);
        port.postMessage({
          type: 'affected',
          affected
        });
        port.unref();
        break;
      case 'getAllDependencies':
        debugLog("Getting all dependencies for", data.files, dependants);
        const deps = findChildrenBulk(data.files, dependencies);
        port.postMessage({
          type: 'dependencies',
          deps
        });
        port.unref();
        break;
      case 'addIgnoreFile':
        debugLog("Addding ignore file", data.file);
        ignore.push(data.file);
      default:
        debugLog(`Unknown message ${data.type}`);
    }
  }

  port.unref();

  return `
  globalThis.__tomato_port = port;
  port.unref();
  globalThis.__tomato_port.unref();
  `
}
