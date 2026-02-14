/* 
Do 2 passes:
1. build jump table
2. run the program itself

Execptions raised:
- MalformedInputError

*/

export class MalformedInputError extends Error {
    public constructor(message = "Malformed input") {
        super(message);
        this.name = "MalformedInputError";
    }
}

export const execute = (code: string, printFunction): number => {
    const raiseMalformedInput = (): never => {
        throw new MalformedInputError();
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
        readHead: number;
        counter: number;
    };

    let currentState: State = {
        readHead: 0,
        counter: 0,
    };

    // produce our next state
    type StateFunction = (state: State, globalJumpTable: JumpTable) => State;

    // token type -> State Function. this is the main crux of our code,
    const tokenTypeToStateFunction: Record<TokenType, StateFunction> = {
        // side effect: print the single counter as ascii
        [TokenType.Print]: (currentState: State, _passedJumpTable) => {
            const { readHead, counter } = currentState;

            // without new line
            const character = String.fromCharCode(counter);

            if (printFunction) {
                printFunction(character);
            }

            // otherwise default in Node
            else if (typeof process !== "undefined") {
                process.stdout.write(character);
            }

            return { counter, readHead: readHead + 1 };
        },

        // move to next instruction. we don't need the jump table
        [TokenType.Continue]: (
            currentState: State,
            _passedJumpTable: JumpTable,
        ): State => {
            const { readHead, counter } = currentState;

            return { counter, readHead: readHead + 1 };
        },
        // increment current counter, move to next instruction.
        [TokenType.Increment]: (
            currentState: State,
            _passedJumpTable: JumpTable,
        ): State => {
            const { counter, readHead } = currentState;
            return {
                counter: counter + 1,
                readHead: readHead + 1,
            };
        },
        // decrement current counter, move to next instruction.
        [TokenType.Decrement]: (
            currentState: State,
            _passedJumpTable: JumpTable,
        ): State => {
            const { counter, readHead } = currentState;
            return {
                counter: counter - 1,
                readHead: readHead + 1,
            };
        },
        // handling looping, check if counter is 0, jump to end of loop, otherwise advance
        [TokenType.Loop_Start]: (
            currentState: State,
            passedJumpTable: JumpTable,
        ): State => {
            const { counter, readHead } = currentState;

            // jump to end of loop
            if (counter === 0) {
                // malformed input
                if (!passedJumpTable.has(readHead)) {
                    raiseMalformedInput();
                }

                const loopEnd = passedJumpTable.get(readHead);
                const nextIndex = loopEnd.index;

                return { counter, readHead: nextIndex };
            }

            // else enter the loop, move to next instruction
            return { counter, readHead: readHead + 1 };
        },
        // if counter !== 0 jump to "[" beginning
        [TokenType.Loop_End]: (
            currentState: State,
            passedJumpTable: JumpTable,
        ): State => {
            const { counter, readHead } = currentState;

            // loop back, jump to loop start
            if (counter !== 0) {
                if (!passedJumpTable.has(readHead)) {
                    raiseMalformedInput();
                }

                const loopStart = passedJumpTable.get(readHead);
                const startIndex = loopStart.index;

                return { counter, readHead: startIndex };
            }

            // counter === 0; move to next instruction
            return { counter, readHead: readHead + 1 };
        },
        // condition check, if counter is 0, jump to end of conidiation, otherwise ++
        [TokenType.If_Start]: (
            currentState: State,
            passedJumpTable: JumpTable,
        ): State => {
            const { counter, readHead } = currentState;

            // jump to if end
            if (counter === 0) {
                // malformed input
                if (!passedJumpTable.has(readHead)) {
                    raiseMalformedInput();
                }

                const ifEnd = passedJumpTable.get(readHead);
                const jumpIndex = ifEnd.index;

                return { counter, readHead: jumpIndex };
            }

            // else enter if
            return { counter, readHead: readHead + 1 };
        },
        // condition cannot loop back, so just advance
        [TokenType.If_End]: (
            currentState: State,
            _passedJumpTable: JumpTable,
        ): State => {
            const { counter, readHead } = currentState;

            return { counter, readHead: readHead + 1 };
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
    while (currentState.readHead < code.length) {
        const { type, _ } = allTokens[currentState.readHead];

        // invalid character
        if (type === undefined) {
            raiseMalformedInput();
        }

        const transform = tokenTypeToStateFunction[type];
        const nextState = transform(currentState, globalJumpTable);
        currentState = nextState;
    }

    // return final counter
    return currentState.counter;
};
