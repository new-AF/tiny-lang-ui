import { mergeClassNames } from "simple-merge-class-names";
import Examples from "./data/Examples.json";
import { useState, useTransition } from "react";
import { execute, MalformedInputError } from "./interpreter/execute";
import { useEffect } from "react";

const Badge = ({ success, children }) => {
    const classes = mergeClassNames(
        "text-xs",
        "inline",
        "rounded-md",
        "ml-1",
        "px-(--spacing-xs)",
        "py-1",
    );

    if (success === true) {
        return (
            <aside className={mergeClassNames(classes, "bg-green-800")}>
                {children}
            </aside>
        );
    }

    if (success === false) {
        return (
            <aside className={mergeClassNames(classes, "bg-red-800")}>
                {children}
            </aside>
        );
    }
};

const Header = ({ isLoading, success, children }) => {
    const badge = (() => {
        if (success === true) {
            return <Badge success={true}>Valid Syntax</Badge>;
        }

        if (success === false) {
            return <Badge success={false}>Invalid Syntax</Badge>;
        }
    })();

    const loadingElement = <div className={mergeClassNames("loader")} />;

    return (
        <h2 className={mergeClassNames("text-lg", "font-semibold")}>
            {children} {isLoading ? loadingElement : badge}
        </h2>
    );
};

// Console Log. Counter Value
const ValueContainer = ({
    header,
    isLoading,
    children,
    disabled,
    disabledMessage,
    success,
    className,
}) => {
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
            <Header isLoading={isLoading} success={success}>
                {header}
            </Header>

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
                {disabled ? disabledMessage : children}
            </div>
        </section>
    );
};

export const App = () => {
    const [state, setState] = useState({
        success: true, // is input valid syntax (has any exception occurred)
        printed: false, // did we print something
        text: "",
        counter: 0,
        log: "", // accumulated characters, reset manually
    });

    // except log, accumulate it
    const updateState = (obj) => {
        setState((prevObj) => {
            const combined = { ...prevObj, ...obj };
            return combined;
        });
    };

    const [isLoading, startTransition] = useTransition();

    // crux of the app
    const runProgram = () => {
        startTransition(() => {
            // build the accumulator
            const array = [];

            // closure, reference `array` from inside function
            const accumulate = (character) => {
                array.push(character);
            };

            // run core interpreter
            // accumulate characters, and get single value counter
            let value;
            try {
                value = execute(state.text, accumulate);

                const string = array.join("");
                const escaped = JSON.stringify(string);
                const printed = array.length > 0; // did we print something

                // if we printed, log that, otherwise, escape ascii value
                updateState({
                    success: true,
                    printed,
                    counter: value,
                    log: escaped,
                });
            } catch (error) {
                if (error instanceof MalformedInputError) {
                    updateState({ success: false });
                }
            }

            // debugger;
        });
    };

    // whener user types in something
    useEffect(runProgram, [state.text]);

    const examples = Examples.map(({ input, expectedOutput }) => {
        return (
            <li
                onClick={() => {
                    window.scrollTo({
                        top: 0,
                        behavior: "smooth", // Smooth scroll animation
                    });
                    updateState({ text: input });
                }}
                key={input.slice(0, 10)}
                className={mergeClassNames(
                    "break-all",
                    "font-mono",
                    "list-inside",
                    "p-(--spacing-sm)",
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
                                <Header success={state.success}>
                                    Your Program
                                </Header>

                                <textarea
                                    value={state.text}
                                    onInput={(event) =>
                                        updateState({
                                            text: event.target.value,
                                        })
                                    }
                                    id="program"
                                    className={mergeClassNames(
                                        "font-semibold",
                                        "p-(--spacing-sm)",
                                        "mt-0.5",
                                        "w-full",
                                        "resize-none",
                                        "rounded-md",
                                        "border-gray-300",
                                        "shadow-sm",
                                        "sm:text-sm",
                                        "dark:text-slate-300",
                                        "dark:border-gray-600",
                                        "dark:bg-gray-900",
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
                                    onClick={() => runProgram()}
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
                        disabled={state.success === false}
                        disabledMessage={"Invalid Syntax"}
                    >
                        {state.counter}
                    </ValueContainer>

                    {/*
                    but only if we printed.
                    > 2 because json escaped empty string is ""
                    Console Log
                    */}
                    {
                        <ValueContainer
                            disabled={
                                state.success === false ||
                                state.printed === false
                            }
                            disabledMessage={
                                state.success === false
                                    ? "Invalid Syntax"
                                    : "No Print Instructions"
                            }
                            header={"Print Output"}
                            isLoading={isLoading}
                            value={state.log}
                        >
                            {state.log}
                        </ValueContainer>
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
