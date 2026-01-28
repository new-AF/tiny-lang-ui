import { execute, MalformedInputError } from "./interpreter/execute.ts";

self.onmessage = (event) => {
    console.log("From Worker: Hi");

    const { data } = event;

    // string
    const { code } = data;

    // try
    try {
        const result = execute(code, (character) => {
            self.postMessage({ message: "accumulate", character });
        });
        self.postMessage({ message: "done", result });
    } catch (error) {
        self.postMessage({ message: "error" });
    }
};
