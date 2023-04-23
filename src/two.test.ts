import { given, test, then, when } from '@tomato/tomato';
//import { foo } from './shared-dep.js';
//foo();

await test("Another test", () => {
  given("nothing");
  when("nothing");
  then("nothing");
});

await test("Another failing test", () => {
  given("nothing");
  when("nothing");
  then("throwing");
  throw new Error("Failing");
});
