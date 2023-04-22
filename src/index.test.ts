import { assert, test, given, then, when } from './index.js';

await test('successful test', () => {
  given("two numbers");

  const a = 1;
  const b = 2;

  when("adding them");

  const res = a + b;

  then("The result is the sum of the 2 numbers");

  assert(res === 3);
});

await test('failing test', () => {
  given("two numbers");

  const a = 1;
  const b = 2;

  when("adding them");

  const res = a + b;

  then("The result is the sum of the 2 numbers");

  assert(res === 2);
});

await test('early fail', () => {
  given("two numbers");
  const a = 1;
  const b = 0;

  when("throwing an error");

  throw new Error("Error");

  then("We get an error");
});
