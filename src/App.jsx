import { mergeClassNames } from "simple-merge-class-names";
import Examples from "./data/Examples.json";
import { useState, useTransition } from "react";
import { exeucte } from "./interpreter/execute";
import { useEffect } from "react";

const LoadingHeader = ({ children, className, isLoading }) => {
    const loadingElement = isLoading ? (
        <div className={mergeClassNames("loader")} />
    ) : undefined;

    return (
        <h2 className={mergeClassNames("text-lg", "font-semibold", className)}>
            {children} {loadingElement}
        </h2>
    );
};

// Console Log. Counter Value
const ValueContainer = ({ children, className }) => {
    return (
        <div
            className={mergeClassNames(
                "font-mono",
                "min-h-10",
                "rounded-md",
                "bg-slate-900",
                "p-(--spacing-sm)",
                className,
            )}
        >
            {children}
        </div>
    );
};

export const App = () => {
    const [text, setText] = useState("");
    const [log, setLog] = useState("");
    const [counter, setCounter] = useState(0);

    const [isLoading, startTransition] = useTransition();

    useEffect(() => {
        startTransition(() => {
            const value = exeucte(text, (paramValue) => {
                setLog(log + paramValue);
            });
            setCounter(value);
        });
    }, [text]);

    const examples = Examples.map(({ input, expectedOutput }) => {
        return (
            <li
                onClick={() => {
                    setText(input);
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
                    "pt-(--spacing-sm)",
                    "pb-(--spacing-md)",
                )}
            >
                <h1 className={mergeClassNames("text-3xl", "font-bold")}>
                    Tiny Lang
                </h1>
            </header>
            <main
                className={mergeClassNames(
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
                        "px-(--spacing-sm)",
                        "pb-(--spacing-md)",
                        "backdrop-blur-md",
                        // "bg-slate-950",
                        "sticky",
                        "top-(--spacing-sm)",
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
                        <textarea
                            value={text}
                            type="text"
                            placeholder="Type your program here..."
                            className={mergeClassNames(
                                "font-mono",
                                "block",
                                "w-full",
                                "px-3",
                                "py-2",
                                "border",
                                "border-slate-300",
                                "rounded-md",
                                "shadow-sm",
                                "placeholder:text-slate-400",
                                "focus:outline-none",
                                "focus:border-blue-500",
                                "focus:ring-blue-500",
                                "sm:text-sm",
                                "resize-y",
                            )}
                        />
                    </section>

                    {/* Console Log */}
                    <section
                        className={mergeClassNames(
                            "flex",
                            "flex-col",
                            "gap-y-(--spacing-sm)",
                        )}
                    >
                        <LoadingHeader isLoading={isLoading}>
                            Console Log
                        </LoadingHeader>

                        <ValueContainer>{log}</ValueContainer>
                    </section>

                    {/* Counter Value */}
                    <section
                        className={mergeClassNames(
                            "flex",
                            "flex-col",
                            "gap-y-(--spacing-sm)",
                        )}
                    >
                        <LoadingHeader isLoading={isLoading}>
                            Counter Value
                        </LoadingHeader>

                        <ValueContainer>{counter}</ValueContainer>
                    </section>
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
