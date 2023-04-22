import { given, test, then, when } from './index.js';

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
