/* 
Do 2 passes:
1. build jump table
2. run the program itself
*/
export const exeucte = (
    code: string,
    printFunction = (value) => process.stdout.write(value),
): number => {
    const raiseMalformedInput = (): never => {
        throw new Error("Malformed input");
    };

    // for better readability and debugability
    enum TokenType {
        Print = "Print",
        Continue = "Continue",
        Increment = "Increment",
        Decrement = "Decrement",
        Loop_Start = "Loop_Start",
        Loop_End = "Loop_End",
        If_Start = "If_Start",
        If_End = "If_End",
    }

    const mapStringToTokenType = {
        "!": TokenType.Print,
        ">": TokenType.Continue,
        "+": TokenType.Increment,
        "-": TokenType.Decrement,
        "[": TokenType.Loop_Start,
        "]": TokenType.Loop_End,
        "{": TokenType.If_Start,
        "}": TokenType.If_End,
    };

    /*
    encode jumps for Loop_Start <-> Loop_End
    If_Start -> If_End
    we don't need  If_End <- If_Start because once if reaches end it cannot loop back
    */
    type JumpTable = Map<number, Token>;

    // doesn't have to be a one-length character
    type Token = { type: TokenType; index: number };

    // match [] {} used to build jump tables
    const stack: Token = [];

    // our machine state
    type State = {
        tapeIndex: number;
        value: number;
    };

    let currentState: State = {
        tapeIndex: 0,
        value: 0,
    };

    // produce our next state
    type StateFunction = (state: State, globalJumpTable: JumpTable) => State;

    // token type -> State Function. this is the main crux of our code,
    const tokenTypeToStateFunction: Record<TokenType, StateFunction> = {
        // side effect: print the single counter as ascii
        [TokenType.Print]: (currentState: State, _passedJumpTable) => {
            const { tapeIndex, value } = currentState;

            // without new line
            const character = String.fromCharCode(value);
            printFunction(character);

            return { value, tapeIndex: tapeIndex + 1 };
        },

        // move to next instruction. we don't need the jump table
        [TokenType.Continue]: (
            currentState: State,
            _passedJumpTable: JumpTable,
        ): State => {
            const { tapeIndex, value } = currentState;

            return { value, tapeIndex: tapeIndex + 1 };
        },
        // increment current value, move to next instruction.
        [TokenType.Increment]: (
            currentState: State,
            _passedJumpTable: JumpTable,
        ): State => {
            const { value, tapeIndex } = currentState;
            return {
                value: value + 1,
                tapeIndex: tapeIndex + 1,
            };
        },
        // decrement current value, move to next instruction.
        [TokenType.Decrement]: (
            currentState: State,
            _passedJumpTable: JumpTable,
        ): State => {
            const { value, tapeIndex } = currentState;
            return {
                value: value - 1,
                tapeIndex: tapeIndex + 1,
            };
        },
        // handling looping, check if value is 0, jump to end of loop, otherwise advance
        [TokenType.Loop_Start]: (
            currentState: State,
            passedJumpTable: JumpTable,
        ): State => {
            const { value, tapeIndex } = currentState;

            // jump to end of loop
            if (value === 0) {
                // malformed input
                if (!passedJumpTable.has(tapeIndex)) {
                    raiseMalformedInput();
                }

                const loopEnd = passedJumpTable.get(tapeIndex);
                const nextIndex = loopEnd.index;

                return { value, tapeIndex: nextIndex };
            }

            // else enter the loop, move to next instruction
            return { value, tapeIndex: tapeIndex + 1 };
        },
        // if value !== 0 jump to "[" beginning
        [TokenType.Loop_End]: (
            currentState: State,
            passedJumpTable: JumpTable,
        ): State => {
            const { value, tapeIndex } = currentState;

            // loop back, jump to loop start
            if (value !== 0) {
                if (!passedJumpTable.has(tapeIndex)) {
                    raiseMalformedInput();
                }

                const loopStart = passedJumpTable.get(tapeIndex);
                const startIndex = loopStart.index;

                return { value, tapeIndex: startIndex };
            }

            // value === 0; move to next instruction
            return { value, tapeIndex: tapeIndex + 1 };
        },
        // condition check, if value is 0, jump to end of conidiation, otherwise ++
        [TokenType.If_Start]: (
            currentState: State,
            passedJumpTable: JumpTable,
        ): State => {
            const { value, tapeIndex } = currentState;

            // jump to if end
            if (value === 0) {
                // malformed input
                if (!passedJumpTable.has(tapeIndex)) {
                    raiseMalformedInput();
                }

                const ifEnd = passedJumpTable.get(tapeIndex);
                const jumpIndex = ifEnd.index;

                return { value, tapeIndex: jumpIndex };
            }

            // else enter if
            return { value, tapeIndex: tapeIndex + 1 };
        },
        // condition cannot loop back, so just advance
        [TokenType.If_End]: (
            currentState: State,
            _passedJumpTable: JumpTable,
        ): State => {
            const { value, tapeIndex } = currentState;

            return { value, tapeIndex: tapeIndex + 1 };
        },
    };

    // convert all tokens for better readability and debugability
    const allTokens: Token[] = Array.from(code, (substring, index) => {
        const type: TokenType = mapStringToTokenType[substring];

        const token = { type, index };
        return token;
    });

    // build the jump table
    const globalJumpTable: JumpTable = new Map<number, Token>();

    for (const token of allTokens) {
        const { type: tokenType, index } = token;
        if (
            tokenType === TokenType.Loop_Start ||
            tokenType === TokenType.If_Start
        ) {
            stack.push(token);
        }
        // do it both ways, jump[start] = end, and jump[end]=start
        else if (tokenType === TokenType.Loop_End) {
            const loopStart = stack.pop();

            if (loopStart === undefined) {
                raiseMalformedInput();
            }

            // malformed input
            if (loopStart.type !== TokenType.Loop_Start) {
                raiseMalformedInput();
            }

            // in case we need to skip over the loop; jump[start] = end
            globalJumpTable.set(loopStart.index, token);

            // in case we need to loop back; jump[end] = start
            globalJumpTable.set(index, loopStart);
        }
        // only one way jump[if_Start] = if_End; because we cannot go back/loop
        else if (tokenType === TokenType.If_End) {
            const ifStart = stack.pop();

            if (ifStart === undefined) {
                raiseMalformedInput();
            }

            // malformed input
            if (ifStart.type !== TokenType.If_Start) {
                raiseMalformedInput();
            }

            globalJumpTable.set(ifStart.index, token);
        }
    }

    // malformed input, incomplete closing token e.g. "[+"
    if (stack.length > 0) {
        raiseMalformedInput();
    }

    // run the program the program, as long as there are instructions
    while (currentState.tapeIndex < code.length) {
        const { type, _ } = allTokens[currentState.tapeIndex];
        const transform = tokenTypeToStateFunction[type];
        const nextState = transform(currentState, globalJumpTable);
        currentState = nextState;
    }

    // return final value
    return currentState.value;
};
