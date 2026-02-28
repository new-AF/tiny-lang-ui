import { mergeClassNames } from "simple-merge-class-names";
import Examples from "./data/Examples.json";
import { useState, useRef, useTransition } from "react";
import { execute, MalformedInputError } from "./interpreter/execute";
import { useEffect } from "react";
import { convertToHumanSyntax } from "./grammar/grammar";

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

const Li = ({ children, className, clickable, ...rest }) => {
    return (
        <li
            {...rest}
            className={mergeClassNames(
                "text-sm",
                "break-all",
                "list-inside",
                "py-(--spacing-sm)",
                "rounded-md",
                "leading-relaxed",
                "px-(--spacing-sm)",
                "py-(--spacing-xs)",
                clickable
                    ? mergeClassNames(
                          "cursor-pointer",
                          "transition",
                          "hover:bg-slate-800",
                      )
                    : false,
                className,
            )}
        >
            {children}
        </li>
    );
};

const Badge = ({ className, children }) => {
    const classes = mergeClassNames(
        "ml-(--spacing-xs)",
        "text-xs",
        "font-medium",
        "inline-flex",
        "items-center",
        "gap-x-1",
        "rounded-md",
        "ml-1",
        "px-(--spacing-xs)",
        "py-1",
        "transition-opacity",
        "duration-200",
    );

    return (
        <aside className={mergeClassNames(classes, className)}>
            {children}
        </aside>
    );
};

const Header = ({ children, className }) => {
    return (
        <h2
            className={mergeClassNames("text-base", "font-semibold", className)}
        >
            {children}
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
                "break-word",
            )}
        >
            {children}
        </p>
    );
};

// Console Log. Counter Value
const ValueContainer = ({
    header,
    children,
    disabled,
    disabledMessage,
    className,
}) => {
    return (
        <section
            className={mergeClassNames(
                "leading-tight",
                "font-normal",
                "text-sm",
                //
                disabled === true
                    ? mergeClassNames("opacity-40", "saturate-50")
                    : false,
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
            <Header className={disabled === true ? "!font-normal" : false}>
                {header}
            </Header>

            <div
                className={mergeClassNames(
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

const Textarea = ({
    className,
    children,
    clearButtonOnClick,
    onInput: originalOnInput,
    ...rest
}) => {
    const textareaRef = useRef(null);

    const autoExpand = (event) => {
        // Reset height to auto
        // Set height to scrollHeight
        event.target.style.height = "auto";
        event.target.style.height = `${event.target.scrollHeight}px`;
    };

    useEffect(() => {
        if (textareaRef.current) {
            // Auto-expand on initial render, simulate 'event'
            autoExpand({ target: textareaRef.current });
        }
    }, []);

    return (
        <>
            <textarea
                ref={textareaRef}
                spellCheck="false"
                className={mergeClassNames(
                    "text-sm",
                    "font-mono",
                    "p-(--spacing-sm)",
                    "mt-0.5",
                    "w-full",
                    "resize-none",
                    "rounded-md",
                    "shadow-sm",
                    "text-slate-300",
                    "bg-gray-900",
                    // Disable white perimeter
                    "focus:outline-none",
                    "focus:ring-2",
                    "focus:ring-offset-0",
                    "focus:shadow-none",
                    className,
                )}
                onInput={(event) => {
                    originalOnInput(event);
                    autoExpand(event);
                }}
                {...rest}
            />

            <div className="mt-0.5 flex items-center justify-end gap-2">
                <button
                    onClick={clearButtonOnClick}
                    type="button"
                    className="cursor-pointer rounded border border-transparent px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-200 dark:hover:text-white"
                >
                    Clear
                </button>
            </div>
        </>
    );
};

export const App = () => {
    const defaultExample =
        Examples.find(({ showAsDefault }) => showAsDefault === true).input ??
        "";

    const [state, setState] = useState({
        status: "ran",
        didWePrint: false, // did we print something
        canonicalSyntax: defaultExample,
        counter: 0,
        log: "", // accumulated characters, reset manually
    });

    // build the accumulator
    const printArray = [];

    // closure, reference `array` from inside function
    const accumulate = (character) => {
        printArray.push(character);
    };

    // executeWorker.ts
    const workerRef = useRef(null);

    // run web worker
    const runCode = () => {
        // convert to human syntax
        const humanSyntax = convertToHumanSyntax(state.canonicalSyntax);

        updateState({
            humanSyntax,
        });

        if (workerRef.current) {
            workerRef.current.terminate();
        }

        // starts executing immediately?
        const worker = new Worker(
            new URL("./executeWorker.ts", import.meta.url),
            { type: "module" },
        );
        workerRef.current = worker;
        worker.postMessage({ code: state.canonicalSyntax });

        // console.log({ worker });

        updateState({
            status: "running",
        });

        worker.onmessage = (event) => {
            const { character, message, result } = event.data;

            if (message === "accumulate") {
                accumulate(character);
            }

            if (message === "done") {
                const string = printArray.join("");
                const escaped = JSON.stringify(string);
                const didWePrint = printArray.length > 0; // did we print something

                updateState({
                    status: "ran", // ran | running | error
                    didWePrint,
                    counter: result,
                    log: escaped,
                });

                worker.terminate();
                workerRef.current = null;
            }

            if (message === "error") {
                updateState({
                    status: "error",
                });
                worker.terminate();
                workerRef.current = null;
            }
        };
    };

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
            updateState({ status: "running" });

            // run core interpreter
            // accumulate characters, and get single value counter
            let value;
            try {
                value = execute(state.canonicalSyntax, accumulate);

                const string = printArray.join("");
                const escaped = JSON.stringify(string);
                const didWePrint = printArray.length > 0; // did we print something

                // if we didWePrint, log that, otherwise, escape ascii value
                updateState({
                    status: "ran", // ran | running | error
                    didWePrint,
                    counter: value,
                    log: escaped,
                });
            } catch (error) {
                if (error instanceof MalformedInputError) {
                    updateState({ status: "error" });
                }
            }

            // debugger;
        });
    };

    // whener user types in something in cannonical syntax
    useEffect(runCode, [state.canonicalSyntax]);

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
                {/* Canonical Input + Human Readable Syntax   */}
                <section
                    className={mergeClassNames(
                        "flex",
                        "flex-col",
                        "gap-y-(--spacing-sm)",
                    )}
                >
                    <label
                        htmlFor="program"
                        className={mergeClassNames(
                            // "outline",
                            "flex",
                            "flex-col",
                            "gap-y-(--spacing-xs)",
                        )}
                    >
                        <Header>
                            Your Program
                            <Badge
                                {...(state.status === "ran"
                                    ? {
                                          className: mergeClassNames(
                                              "bg-emerald-800",
                                              "text-slate-200",
                                          ),
                                          children:
                                              "Completed running (halted)",
                                      }
                                    : state.status === "error"
                                      ? {
                                            className: mergeClassNames(
                                                "bg-rose-800",
                                                "text-slate-200",
                                            ),
                                            children: "Has invalid syntax",
                                        }
                                      : state.status === "running"
                                        ? {
                                              className: mergeClassNames(
                                                  "bg-amber-800",
                                                  "text-slate-200",
                                              ),
                                              children: (
                                                  <>
                                                      Is running...
                                                      <div
                                                          className={mergeClassNames(
                                                              "loader",
                                                          )}
                                                      />
                                                  </>
                                              ),
                                          }
                                        : {})}
                            />
                        </Header>

                        {/* Canonical Syntax */}
                        <span
                            className={mergeClassNames(
                                "mt-(--spacing-xs)",
                                "text-xs",
                                "text-slate-400",
                            )}
                        >
                            Canonical Syntax
                        </span>

                        <Textarea
                            className={
                                state.status === "ran"
                                    ? mergeClassNames(
                                          "focus-visible:ring-emerald-800",
                                      )
                                    : state.status === "running"
                                      ? mergeClassNames(
                                            "focus-visible:ring-amber-800",
                                        )
                                      : state.status === "error"
                                        ? mergeClassNames(
                                              "focus-visible:ring-rose-800",
                                          )
                                        : mergeClassNames(
                                              "focus-visible:ring-gray-600",
                                          )
                            }
                            value={state.canonicalSyntax}
                            onInput={(event) => {
                                const canonicalSyntax = event.target.value;

                                updateState({
                                    canonicalSyntax,
                                });
                            }}
                            clearButtonOnClick={() => updateState({ text: "" })}
                        />

                        {/*  Human Readable Syntax */}
                        <span
                            className={mergeClassNames(
                                "text-xs",
                                "text-slate-400",
                            )}
                        >
                            Human Readable Syntax
                        </span>
                        <Textarea
                            disabled
                            value={state.humanSyntax}
                            onClick={(event) => {}}
                        />
                    </label>
                </section>

                {/* Counter + Print Output  */}
                <div
                    className={mergeClassNames(
                        "flex",
                        "flex-col",
                        "gap-y-(--spacing-md)",
                    )}
                >
                    {/* Counter Value */}
                    <ValueContainer
                        header={"Counter Value"}
                        disabled={state.status === "error"}
                        disabledMessage={"Invalid Syntax"}
                    >
                        {state.counter}
                    </ValueContainer>

                    {/*
                    but only if we didWePrint.
                    > 2 because json escaped empty string is ""
                    Console Log
                    */}

                    <ValueContainer
                        disabled={
                            state.status === "error" ||
                            state.status === "running" ||
                            state.didWePrint === false
                        }
                        disabledMessage={
                            state.status === "error"
                                ? "Invalid Syntax"
                                : "No Print Instructions"
                        }
                        header={"Print Output"}
                        value={state.log}
                    >
                        {state.log}
                    </ValueContainer>
                </div>
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
                        language, designed by yours truly as a solution to an
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
                        {Examples.map(
                            ({ input, expectedOutput, description }) => {
                                return (
                                    <Li
                                        clickable
                                        onClick={() => {
                                            window.scrollTo({
                                                top: 0,
                                                behavior: "smooth", // Smooth scroll animation
                                            });
                                            updateState({
                                                canonicalSyntax: input,
                                            });
                                        }}
                                        key={expectedOutput}
                                        className={mergeClassNames("font-mono")}
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

                                        {/* description */}
                                        {description && (
                                            <span
                                                className={mergeClassNames(
                                                    "px-(--spacing-xs)",
                                                    "!font-normal",
                                                    "text-slate-500",
                                                    "text-xs",
                                                )}
                                            >
                                                ({description})
                                            </span>
                                        )}
                                    </Li>
                                );
                            },
                        )}
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
