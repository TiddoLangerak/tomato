import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run } from "./process.js";

const initialDifftool = process.env.DIFFTOOL || 'git diff --color=always';
let difftool = initialDifftool;


export async function diff<T>(expected: T, actual: T) {
  if (typeof expected !== 'string' || typeof actual !== 'string') {
    return '';
  }

  const dir = await fs.mkdtemp(join(tmpdir(), 'tomato-'))
  const expectedFile = join(dir, `expected`);
  const actualFile = join(dir, `actual`);
  await Promise.all([
    fs.writeFile(expectedFile, expected),
    fs.writeFile(actualFile, actual)
  ]);

  const { outputs } = await run('/bin/bash', ["-c", `${difftool} ${expectedFile} ${actualFile}`]);
  // In theory, we could do a rm -rf, but that's risky in the presence of potential bugs.
  // If somehow `dir` gets corrupted, I don't want to risk removing non test files.
  // Since it's just 2 files and a folder, we can remove it by hand
  await Promise.all([
    fs.unlink(expectedFile),
    fs.unlink(actualFile),
  ]);
  await fs.rmdir(dir);
  const output = outputs.map(({ value }) => value).join('');
  return output;
}

// Mainly intended for testing
export function __setDifftool(newDifftool: string) {
  difftool = newDifftool;
}

export function __resetDifftool() {
  difftool = initialDifftool;
}

