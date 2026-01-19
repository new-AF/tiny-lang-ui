import { mergeClassNames } from "simple-merge-class-names";

export const App = () => {
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
            <main className={mergeClassNames("px-(--spacing-sm)")}>
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
