import { formatError, withIndent } from "./util.js";

export type Success = {
  description: string,
  file: string
}
export type Failure = {
  description: string,
  error: any,
  file: string
};
export let successes: Success[] = [];
export let failures: Failure[] = [];

export async function printAndResetSummary() {
  let lastFile: string = "";
  if (successes.length || failures.length) {
    console.log("══════════════════════════════\n");
    console.log("Summary:");
    console.log(`    Successes: ${successes.length}`);
    console.log(`    Failures: ${failures.length}`);
    console.log("");

    if (failures.length) {
      console.error("Tests failed:");
    }
    for (const failure of failures) {
      if (failure.file !== lastFile) {
        console.error(`    File: ${failure.file}`);
        console.error("");
      }
      lastFile = failure.file;
      console.error(`        Test: ${failure.description}`);
      console.error(`        Failure:`);
      console.error(withIndent(await formatError(failure.error) , '            '));
    }
    console.log("══════════════════════════════");
    successes = [];
    failures = [];
  }
}
