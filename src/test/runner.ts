import { getDirname } from '../module.js';
import { run } from '../process.js';
import path from 'node:path';

const __dirname = getDirname(import.meta.url);

export async function runTest(test: string) {
  const testFile = `
  import { test, Given, When, Then, expect, onCleanup } from './index.js';

  ${test}
  `;

  const { outputs, stderr, stdout, exitCode} = await run(
    'node',
    {
      args: ['--loader', 'ts-node/esm', '--no-warnings', '--input-type', 'module'],
      spawnOpts: { cwd: path.resolve(__dirname, ".."), env: { ...process.env, NODE_OPTIONS: undefined } },
      stdin: testFile
    }
  );

  return { stdout, stderr, output: combineOutputs(outputs), exitCode };
}

export async function runWithRunner(files: string[]) {
  const { outputs, stderr, stdout, exitCode} = await run(
    'node',
    {
      args: ['--loader', 'ts-node/esm', '--no-warnings', path.resolve(__dirname, '../cli.ts')],
      spawnOpts: { env: { ...process.env, NODE_OPTIONS: undefined } },
      stdin: files.join('\n')
    }
  );

  return { stdout, stderr, output: combineOutputs(outputs), exitCode };
}

export async function runWithWatcher(files: string[], abortSignal: AbortSignal) {
  const { outputs, stderr, stdout, exitCode} = await run(
    'node',
    {
      args: ['--loader', 'ts-node/esm', '--loader', path.resolve(__dirname, '../../loader.mjs'), '--no-warnings', path.resolve(__dirname, '../cli.ts'), '-w'],
      spawnOpts: { env: { ...process.env, NODE_OPTIONS: undefined } },
      stdin: files.join('\n'),
      abortSignal
    }
  );

  return { stdout, stderr, output: combineOutputs(outputs), exitCode };
}

function combineOutputs(outputs: { type: string, value: string }[]): string {
  return outputs
    .map(({ type, value }) => `${type}:` + value.toString().replaceAll(/\n(?!$)/g, `\n${type}:`))
    .join('');
}
