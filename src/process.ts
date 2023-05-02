import { SpawnOptions, SpawnOptionsWithoutStdio, spawn } from "node:child_process";

export async function run(command: string, args?: readonly string[], opts?: SpawnOptions, stdin?: string) {
  const childProcess = spawn(command, args, opts as SpawnOptionsWithoutStdio);
  if (stdin) {
    await new Promise<void>((resolve, reject) => {
      childProcess.stdin.write(stdin, (err) => {
        err ? reject(err): resolve();
      });
    });
    await new Promise<void>((resolve) => childProcess.stdin.end(() => resolve()));
  }

  let stdout = "";
  let stderr = "";
  const outputs: { type: string, value:string}[] = [];
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

  const exitCode = await new Promise<number | null>((resolve) => {
    childProcess.on('close', (code) => resolve(code));
  });

  return { stdout, stderr, outputs, exitCode };
}
