import { describe, it } from "node:test";
import { deepStrictEqual } from "node:assert/strict";
import { execute } from "../src/interpreter/execute";

const itCases = [
    { input: "+++", expectedOutput: 3 },
    { input: "+--", expectedOutput: -1 },
    { input: ">+++[-]", expectedOutput: 0, debug: false },
    { input: ">>>+{++}", expectedOutput: 3 },
    { input: "+{[-]+}+", expectedOutput: 2 },
    { input: "{+}{+}{+}", expectedOutput: 0 },
    { input: "------[+]++", expectedOutput: 2 },
    { input: "-[++{-}]+{++++}", expectedOutput: 5 },
    // chatty
    { input: "-[+{+}]+", expectedOutput: 1 },
    { input: "[{}]", expectedOutput: 0 },
];

describe("execute(...)", () => {
    itCases.forEach(({ input, expectedOutput, debug }) => {
        if (debug) {
            globalThis.__debug = true;
        }
        const result = execute(input);
        const testFunction = () => deepStrictEqual(result, expectedOutput);
        it(`execute(${input}) should return >${expectedOutput}<`, testFunction);
    });
});
