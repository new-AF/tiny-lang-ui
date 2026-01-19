import { mergeClassNames } from "simple-merge-class-names";
import Examples from "./data/Examples.json";

export const App = () => {
    const examples = Examples.map(({ input, expectedOutput }) => {
        return (
            <li
                key={expectedOutput}
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
                        <h2
                            className={mergeClassNames(
                                "text-lg",
                                "font-semibold",
                            )}
                        >
                            Console Log
                        </h2>

                        <div
                            className={mergeClassNames(
                                "min-h-10",
                                "rounded-md",
                                "bg-slate-900",
                            )}
                        />
                    </section>

                    {/* Counter Value */}
                    <section
                        className={mergeClassNames(
                            "flex",
                            "flex-col",
                            "gap-y-(--spacing-sm)",
                        )}
                    >
                        <h2
                            className={mergeClassNames(
                                "text-lg",
                                "font-semibold",
                            )}
                        >
                            Counter Value
                        </h2>

                        <div
                            className={mergeClassNames(
                                "min-h-10",
                                "rounded-md",
                                "bg-slate-900",
                            )}
                        />
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
