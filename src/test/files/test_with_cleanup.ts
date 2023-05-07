import { test, onCleanup } from "../../index.js";

onCleanup(() => console.log("On cleanup"));
await test("Test 1", () => {});
await test("Test 2", () => {});

