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
                )}
            >
                {/* input */}
                <span className={mergeClassNames("ml-(--spacing-xs)")}>
                    {input}
                </span>

                {/* expectedOutput */}
                <span
                    className={mergeClassNames(
                        "ml-(--spacing-sm)",
                        "bg-slate-800",
                        "text-sm",
                        "rounded-md",
                        "px-(--spacing-xs)",
                        "py-[0.1em]",
                    )}
                >
                    ({expectedOutput} is expected output)
                </span>
            </li>
        );
    });

    return (
        <>
            <header
                className={mergeClassNames(
                    "flex",
                    "flex-col",
                    "items-center",
                    "py-(--spacing-sm)",
                )}
            >
                <h1 className={mergeClassNames("text-3xl", "font-bold")}>
                    Tiny Lang
                </h1>
            </header>
            <main
                className={mergeClassNames(
                    "px-(--spacing-sm)",
                    "flex",
                    "flex-col",
                    "gap-y-(--spacing-sm)",
                )}
            >
                {/* input */}
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

                {/* output */}
                <section
                    className={mergeClassNames(
                        "flex",
                        "flex-col",
                        "gap-y-(--spacing-sm)",
                    )}
                >
                    <h2 className={mergeClassNames("text-lg", "font-semibold")}>
                        Output
                    </h2>
                </section>

                {/* examples */}
                <section
                    className={mergeClassNames(
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
