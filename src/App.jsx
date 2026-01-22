import { mergeClassNames } from "simple-merge-class-names";
import Examples from "./data/Examples.json";
import { useState, useTransition } from "react";
import { execute, MalformedInputError } from "./interpreter/execute";
import { useEffect } from "react";

const Code = ({ children, "mr-only": mrOnly }) => {
    return (
        <code
            className={mergeClassNames(
                "align-middle",
                "text-sm",
                "px-(--spacing-xs)",
                "py-1",
                "bg-slate-700",
                "rounded-md",
                mrOnly ? "mr-[0.1em]" : "mx-[0.1em]",
            )}
        >
            {children}
        </code>
    );
};

const Li = ({ children, className, ...rest }) => {
    return (
        <li
            {...rest}
            className={mergeClassNames(
                "leading-relaxed",
                "px-(--spacing-sm)",
                "py-(--spacing-xs)",
                "text-sm",
                className,
            )}
        >
            {children}
        </li>
    );
};

const Badge = ({ success, children }) => {
    const classes = mergeClassNames(
        "text-xs",
        "font-medium",
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
            return <Badge success={true}>Has Valid Syntax</Badge>;
        }

        if (success === false) {
            return <Badge success={false}>Has Invalid Syntax</Badge>;
        }
    })();

    const loadingElement = <div className={mergeClassNames("loader")} />;

    return (
        <h2 className={mergeClassNames("text-base", "font-semibold")}>
            {children} {isLoading ? loadingElement : badge}
        </h2>
    );
};

const ExpectedOutput = ({ children }) => {
    return (
        <span
            className={mergeClassNames(
                "text-xs",
                "block",
                "mt-(--spacing-xs)",
                "w-[max-content]",
                "text-slate-500",
                "rounded-md",
                "px-(--spacing-xs)",
                "py-[0.1em]",
            )}
        >
            <span className={mergeClassNames("font-medium", "text-slate-400")}>
                (expected output:
            </span>{" "}
            <span className={mergeClassNames("font-mono", "text-slate-200")}>
                {children}
            </span>
            )
        </span>
    );
};

const Paragraph = ({ children }) => {
    return (
        <p
            className={mergeClassNames(
                "leading-relaxed",
                "text-slate-300",
                "text-sm",
                "break-all",
            )}
        >
            {children}
        </p>
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
                "leading-tight",
                "font-normal",
                "text-sm",
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
                <h1 className={mergeClassNames("text-3xl", "font-semibold")}>
                    Tiny Lang
                </h1>
            </header>
            <main
                className={mergeClassNames(
                    // "overflow-x-auto",
                    //
                    "pt-(--spacing-lg)",
                    "pb-(--spacing-md)",
                    "px-(--spacing-sm)",
                    "flex",
                    "flex-col",
                    // lg
                    "lg:max-w-4xl",
                    "lg:mx-auto",
                    "gap-y-(--spacing-lg)",
                )}
            >
                {/*  Input + Console Log + Counter Value */}

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
                            htmlFor="program"
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
                                    "text-sm",
                                    "font-mono",
                                    "p-(--spacing-sm)",
                                    "mt-0.5",
                                    "w-full",
                                    "resize-none",
                                    "rounded-md",
                                    "border-gray-300",
                                    "shadow-sm",
                                    "dark:text-slate-300",
                                    "dark:border-gray-600",
                                    "dark:bg-gray-900",
                                )}
                                rows="4"
                            />
                        </label>

                        <div className="mt-1.5 flex items-center justify-end gap-2">
                            <button
                                onClick={() => updateState({ text: "" })}
                                type="button"
                                className="cursor-pointer rounded border border-transparent px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-200 dark:hover:text-white"
                            >
                                Clear
                            </button>

                            <button
                                onClick={() => runProgram()}
                                type="button"
                                className="cursor-pointer rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
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
                            state.success === false || state.printed === false
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

                {/* Description */}
                <section
                    className={mergeClassNames(
                        "flex",
                        "flex-col",
                        "gap-y-(--spacing-sm)",
                    )}
                >
                    <Header>Description</Header>

                    <Paragraph>
                        <i>Tiny Lang</i> is a <i>non-turing</i> programming
                        language, desinged by yours truly as a solution to an
                        AdventJS 2025{" "}
                        <a href="https://adventjs.dev/challenges/2025/25">
                            challenge
                        </a>
                        . Its syntax is heavily inspired by <i>BrainF---</i>
                    </Paragraph>

                    <Paragraph>
                        It has a single counter (initially <Code>0</Code>) and
                        it consumes a sequence of instructions, each being a
                        1-length character which modifies this counter.
                    </Paragraph>

                    <Paragraph>
                        I further extended the language by adding ability to
                        print, this is done by the <Code>!</Code> instruction.
                        You can learn more about the backstory and inner
                        workings of the interpreter in{" "}
                        <a href="https://af-dev.com/blog/i-built-a-tiny-programming-language-from-scratch">
                            my article
                        </a>{" "}
                        😉
                    </Paragraph>
                </section>

                {/* Syntax */}
                <section
                    className={mergeClassNames(
                        "flex",
                        "flex-col",
                        "gap-y-(--spacing-sm)",
                    )}
                >
                    <Header>Syntax Reference</Header>

                    <ul className={mergeClassNames("gap-y-(--spacing-sm)")}>
                        <Li>
                            <Code mr-only>+</Code> increments the counter
                        </Li>
                        <Li>
                            <Code mr-only>-</Code> decrements it
                        </Li>
                        <Li>
                            <Code mr-only>[</Code> opening block of a C-style{" "}
                            <Code no-margin>while</Code> loop. If the counter is
                            zero, we skip over the loop and onto the next
                            instruction. If the counter is non-zero the loop
                            runs. You can read it as <Code>while non-zero</Code>{" "}
                            execute these inner statements. As with any program
                            you can create an infite loop e.g. <Code>+[+]</Code>
                        </Li>
                        <Li>
                            <Code mr-only>]</Code> while closing block.
                        </Li>
                        <Li>
                            <Code mr-only>{"{"}</Code> opening block of an{" "}
                            <Code>if</Code> statement. If the counter is zero we
                            skip its contents. If the coutner is non-zero we
                            executre the contents <strong>once</strong>. You can
                            read it as <Code>if non-zero</Code> execute those
                            inner statements. It is possible to nest{" "}
                            <Code>while</Code> and <Code>if</Code> arbitrarily.
                        </Li>
                        <Li>
                            <Code mr-only>{"}"}</Code> if closing block.
                        </Li>
                        <Li>
                            <Code mr-only>&gt;</Code> does nothing but advance
                            the read head
                            <span className="ml-1 text-slate-400">
                                (think Python <Code>pass</Code>)
                            </span>
                        </Li>
                        <Li>
                            <Code mr-only>!</Code> prints the current counter as
                            an ASCII character.
                        </Li>
                    </ul>
                </section>

                {/* Examples */}
                <section
                    className={mergeClassNames(
                        "flex",
                        "flex-col",
                        "gap-y-(--spacing-sm)",
                    )}
                >
                    <Header>Try These Examples</Header>
                    <Paragraph>
                        Click on an example program to load it and see its
                        result.
                    </Paragraph>
                    <ul
                        className={mergeClassNames(
                            "list-['👉🏽']",
                            "flex",
                            "flex-col",
                            "gap-y-(--spacing-sm)",
                        )}
                    >
                        {Examples.map(({ input, expectedOutput }) => {
                            return (
                                <Li
                                    onClick={() => {
                                        window.scrollTo({
                                            top: 0,
                                            behavior: "smooth", // Smooth scroll animation
                                        });
                                        updateState({ text: input });
                                    }}
                                    key={input.slice(0, 10)}
                                    className={mergeClassNames(
                                        "text-sm",
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
                                    <span
                                        className={mergeClassNames(
                                            "ml-(--spacing-xs)",
                                            "[overflow-wrap:anywhere]",
                                        )}
                                    >
                                        {input}
                                    </span>

                                    {/* expectedOutput */}
                                    <ExpectedOutput>
                                        {expectedOutput}
                                    </ExpectedOutput>
                                </Li>
                            );
                        })}
                    </ul>
                </section>
            </main>
            <footer
                className={mergeClassNames(
                    "text-sm",
                    "text-center",
                    "py-(--spacing-sm)",
                    "text-slate-400",
                )}
            >
                By{" "}
                <a
                    href="https://af-dev.com/blog/i-built-a-tiny-programming-language-from-scratch"
                    className={mergeClassNames("font-medium")}
                >
                    Abdullah Fatota
                </a>
            </footer>
        </>
    );
};
