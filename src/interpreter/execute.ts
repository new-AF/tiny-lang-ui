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
        WhileStart = "WhileStart",
        WhileEnd = "WhileEnd",
        IfStart = "IfStart",
        IfEnd = "IfEnd",
    }

    // part of tokenization, and for better DX
    const characterToTokenType = {
        "!": TokenType.Print,
        ">": TokenType.Continue,
        "+": TokenType.Increment,
        "-": TokenType.Decrement,
        "[": TokenType.WhileStart,
        "]": TokenType.WhileEnd,
        "{": TokenType.IfStart,
        "}": TokenType.IfEnd,
    };

    /*
    Record locations of WhileStart, WhileEnd, IfStart, IfEnd
    we don't need  IfStart <- IfEnd because once if reaches end it cannot loop back
    */
    type JumpTable = Map<number, Token>;

    // doesn't have to be a one-length character
    type Token = { type: TokenType; index: number };

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
    const tokenTypeToTransitionFunction: Record<TokenType, StateFunction> = {
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
        [TokenType.WhileStart]: (
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

                const WhileEnd = passedJumpTable.get(readHead);
                const nextIndex = WhileEnd.index;

                return { counter, readHead: nextIndex };
            }

            // else enter the loop, move to next instruction
            return { counter, readHead: readHead + 1 };
        },
        // if counter !== 0 jump to "[" beginning
        [TokenType.WhileEnd]: (
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
        [TokenType.IfStart]: (
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
        [TokenType.IfEnd]: (
            currentState: State,
            _passedJumpTable: JumpTable,
        ): State => {
            const { counter, readHead } = currentState;

            return { counter, readHead: readHead + 1 };
        },
    };

    // convert all tokens for better readability and debugability
    const tokens: Token[] = Array.from(code, (substring, index) => {
        const type: TokenType = characterToTokenType[substring];

        const token = { type, index };
        return token;
    });

    // process each token, call transition function, return new state
    const interpretToken = (
        currentToken: Token,
        globalJumpTable: JumpTable,
    ): State => {
        const { type, _index } = currentToken;

        // invalid character
        if (type === undefined) {
            raiseMalformedInput();
        }

        const transitionFunction = tokenTypeToTransitionFunction[type];
        const nextState = transitionFunction(currentState, globalJumpTable);

        return nextState;
    };

    // build the jump table
    const buildJumpTable = (tokens: Token[]): JumpTable => {
        // match [] {} used to build jump tables
        const stack: Token[] = [];

        const jumpTable: JumpTable = new Map();

        for (const token of tokens) {
            const { type: tokenType, index } = token;
            if (
                tokenType === TokenType.WhileStart ||
                tokenType === TokenType.IfStart
            ) {
                stack.push(token);
            }
            // do it both ways, jump[start] = end, and jump[end]=start
            else if (tokenType === TokenType.WhileEnd) {
                const loopStart = stack.pop();

                if (loopStart === undefined) {
                    raiseMalformedInput();
                }

                // malformed input
                if (loopStart.type !== TokenType.WhileStart) {
                    raiseMalformedInput();
                }

                // in case we need to skip over the loop; jump[start] = end
                jumpTable.set(loopStart.index, token);

                // in case we need to loop back; jump[end] = start
                jumpTable.set(index, loopStart);
            }
            // only one way jump[ifStart] = ifEnd; because we cannot go back/loop
            else if (tokenType === TokenType.IfEnd) {
                const ifStart = stack.pop();

                if (ifStart === undefined) {
                    raiseMalformedInput();
                }

                // malformed input
                if (ifStart.type !== TokenType.IfStart) {
                    raiseMalformedInput();
                }

                jumpTable.set(ifStart.index, token);
            }
        }

        // malformed input, incomplete closing token e.g. "[+"
        if (stack.length > 0) {
            raiseMalformedInput();
        }

        return jumpTable;
    };

    // build the jump table
    const globalJumpTable = buildJumpTable(tokens);

    // run the program the program, as long as there are instructions
    while (currentState.readHead < tokens.length) {
        const currentToken = tokens[currentState.readHead];
        const nextState = interpretToken(currentToken, globalJumpTable);
        currentState = nextState;
    }

    // return final counter
    return currentState.counter;
};
