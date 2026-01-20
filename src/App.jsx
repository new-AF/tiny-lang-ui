import { mergeClassNames } from "simple-merge-class-names";
import Examples from "./data/Examples.json";
import { useState, useTransition } from "react";
import { exeucte } from "./interpreter/execute";
import { useEffect } from "react";

// Console Log. Counter Value
const ValueContainer = ({
    header,
    isLoading,
    value,
    children,
    disabled,
    className,
}) => {
    const loadingElement = isLoading ? (
        <div className={mergeClassNames("loader")} />
    ) : undefined;

    return (
        <section
            className={mergeClassNames(
                //
                disabled === true ? "opacity-40 saturate-50" : false,
                //
                "transition-all",
                "duration-300",
                "ease-out",
                // smoothen animiation
                "flex",
                "flex-col",
                "gap-y-(--spacing-sm)",
                className,
            )}
        >
            <h2 className={mergeClassNames("text-lg", "font-semibold")}>
                {header} {loadingElement}
            </h2>

            <div
                className={mergeClassNames(
                    disabled ? "italic" : false,
                    // hacked this
                    "max-w-[90vw]",
                    "overflow-x-auto",
                    //
                    "font-mono",
                    "rounded-md",
                    "bg-slate-900",
                    "p-(--spacing-sm)",
                )}
            >
                {disabled ? "No Output" : (value ?? children)}
            </div>
        </section>
    );
};

export const App = () => {
    const toEscapedAscii = (value) => {
        const ascii = String.fromCharCode(value);
        const string = JSON.stringify(ascii);
        return string;
    };

    const [state, setState] = useState({
        text: "",
        counter: 0,
        log: toEscapedAscii(0), // accumulated characters, reset manually
    });

    // except log, accumulate it
    const updateState = (obj) => {
        setState((prevObj) => {
            const combined = { ...prevObj, ...obj };
            return combined;
        });
    };

    const [isLoading, startTransition] = useTransition();

    // whener user types in smth
    useEffect(() => {
        // reset accumuluated output
        updateState({ log: "" });
        startTransition(() => {
            // build the accumulator
            const array = [];

            // closure, reference `array` from inside function
            const accumulate = (character) => {
                array.push(character);
            };

            // accumulate characters, and get single value counter
            const value = exeucte(state.text, accumulate);

            const string = array.join("");
            const escaped = JSON.stringify(string);

            // if we printed, log that, otherwise, escape ascii value
            updateState({
                counter: value,
                log: escaped,
            });
            // debugger;
        });
    }, [state.text]);

    const examples = Examples.map(({ input, expectedOutput }) => {
        return (
            <li
                onClick={() => {
                    updateState({ text: input });
                }}
                key={input.slice(0, 10)}
                className={mergeClassNames(
                    "break-all",
                    "font-mono",
                    "list-inside",
                    "py-(--spacing-sm)",
                    "rounded-md",
                    "cursor-pointer",
                    "transition",
                    "hover:bg-slate-800",
                )}
            >
                {/* input */}
                <span className={mergeClassNames("ml-(--spacing-xs)")}>
                    {input}
                </span>

                {/* expectedOutput */}
                <span
                    className={mergeClassNames(
                        "block",
                        "mt-(--spacing-xs)",
                        "w-[max-content]",
                        "text-slate-500",
                        "text-sm",
                        "rounded-md",
                        "px-(--spacing-xs)",
                        "py-[0.1em]",
                        // lg
                        "lg:inline",
                        "lg:ml-(--spacing-sm)",
                    )}
                >
                    (expected output: {expectedOutput})
                </span>
            </li>
        );
    });

    /* return */
    return (
        <>
            <header
                className={mergeClassNames(
                    "flex",
                    "flex-col",
                    "items-center",
                    "pt-(--spacing-md)",
                )}
            >
                <h1 className={mergeClassNames("text-3xl", "font-bold")}>
                    Tiny Lang
                </h1>
            </header>
            <main
                className={mergeClassNames(
                    // "overflow-x-auto",
                    //
                    "flex",
                    "flex-col",
                    // lg
                    "lg:max-w-4xl",
                    "lg:mx-auto",
                )}
            >
                {/* Sticky: Input + Console Log + Counter Value */}
                <div
                    className={mergeClassNames(
                        //
                        "px-(--spacing-sm)",
                        "py-(--spacing-md)",
                        "backdrop-blur-xl",
                        // "bg-slate-950",
                        "sticky",
                        "top-0",
                        "flex",
                        "flex-col",
                        "gap-y-(--spacing-md)",
                    )}
                >
                    {/* Input */}
                    <section
                        className={mergeClassNames(
                            "flex",
                            "flex-col",
                            "gap-y-(--spacing-sm)",
                        )}
                    >
                        <div
                            className={mergeClassNames(
                                "flex",
                                "flex-col",
                                "gap-y-(--spacing-xs)",
                            )}
                        >
                            <label
                                for="program"
                                className={mergeClassNames(
                                    "flex",
                                    "flex-col",
                                    "gap-y-(--spacing-xs)",
                                )}
                            >
                                <span class="text-lg font-medium">
                                    Your Program
                                </span>

                                <textarea
                                    value={state.text}
                                    onInput={(event) =>
                                        updateState({
                                            text: event.target.value,
                                        })
                                    }
                                    id="program"
                                    className={mergeClassNames(
                                        "p-(--spacing-sm)",
                                        "mt-0.5 w-full resize-none rounded-md border-gray-300 shadow-sm sm:text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white",
                                    )}
                                    rows="4"
                                />
                            </label>

                            <div class="mt-1.5 flex items-center justify-end gap-2">
                                <button
                                    onClick={() => updateState({ text: "" })}
                                    type="button"
                                    class="cursor-pointer rounded border border-transparent px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-200 dark:hover:text-white"
                                >
                                    Clear
                                </button>

                                <button
                                    type="button"
                                    class="cursor-pointer rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                                >
                                    Run
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Counter Value */}
                    <ValueContainer
                        header={"Counter Value"}
                        isLoading={isLoading}
                        value={state.counter}
                    />

                    {/*
                    but only if we printed.
                    > 2 because json escaped empty string is ""
                    Console Log
                    */}
                    {
                        <ValueContainer
                            disabled={!(state.log && state.log.length > 2)}
                            header={"Print Output"}
                            isLoading={isLoading}
                            value={state.log}
                        />
                    }
                </div>

                {/* Examples */}
                <section
                    className={mergeClassNames(
                        "px-(--spacing-sm)",
                        "flex",
                        "flex-col",
                        "gap-y-(--spacing-sm)",
                    )}
                >
                    <h2 className={mergeClassNames("text-lg", "font-semibold")}>
                        Examples
                    </h2>
                    <ul
                        className={mergeClassNames(
                            "list-['👉🏽']",
                            "flex",
                            "flex-col",
                            "gap-y-(--spacing-sm)",
                        )}
                    >
                        {examples}
                    </ul>
                </section>
            </main>
            <footer
                className={mergeClassNames(
                    "text-center",
                    "py-(--spacing-sm)",
                    "text-slate-400",
                )}
            >
                By{" "}
                <a href="https://af-dev.com/blog/i-built-a-tiny-programming-language-from-scratch">
                    Abdullah Fatota
                </a>
            </footer>
        </>
    );
};
