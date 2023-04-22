import { runAll } from './runner.js';
declare global {
  var __tomato_runner: boolean;
}
globalThis.__tomato_runner = true;
runAll();
