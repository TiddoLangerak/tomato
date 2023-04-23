import { red } from "./colors.js";
import util from 'util';
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

// TODO: this seems to be broken, nothing prints for either watch or non-watch mode
export function printAndResetSummary() {
  let lastFile: string = "";
  if (successes.length || failures.length) {
    console.log("══════════════════════════════\n");
    console.log("Summary:");
    console.log(`    Successes: ${successes.length}`);
    console.log(`    Failures: ${failures.length}`);

    if (failures.length) {
      console.log("");
      console.log("Tests failed:");
    }
    for (const failure of failures) {
      if (failure.file !== lastFile) {
        console.log(`    File: ${failure.file}`);
        console.log("");
      }
      lastFile = failure.file;
      console.log(`        Test: ${failure.description}`);
      console.log(`        Failure:`);
      console.error(withIndent(formatError(failure.error) , '            '));
    }
    console.log("\n══════════════════════════════");
    successes = [];
    failures = [];
  }
}
