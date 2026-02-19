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
        Pass = "Pass",
        Increment = "Increment",
        Decrement = "Decrement",
        WhileStart = "WhileStart",
        WhileEnd = "WhileEnd",
        IfStart = "IfStart",
        IfEnd = "IfEnd",
    }

    /*
    Record locations of WhileStart, WhileEnd, IfStart, IfEnd
    we don't need IfEnd -> IfStart because once if reaches end it cannot loop back
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

    // --------- token processing arrow functions ---------

    // process "!" print instruction
    // side effect: print the single counter as ascii. advance read head.
    const processPrint = (currentState: State, _passedJumpTable) => {
        const { readHead, counter } = currentState;

        // without new line
        const character = String.fromCharCode(counter);

        // external custom accumulating/printing function
        if (printFunction) {
            printFunction(character);
        }

        // otherwise default in Node.js
        else if (typeof process !== "undefined") {
            process.stdout.write(character);
        }

        return { counter, readHead: readHead + 1 };
    };

    // process ">" pass instruction
    // just advance read head, move to next instruction. we don't need the jump table
    const processPass = () => {
        const { readHead, counter } = currentState;

        return { counter, readHead: readHead + 1 };
    };

    // process "+" increment instruction
    // increment current counter, move to next instruction.
    const processIncrement = () => {
        const { counter, readHead } = currentState;
        return {
            counter: counter + 1,
            readHead: readHead + 1,
        };
    };

    // process "-" decrement instruction
    // decrement current counter, move to next instruction.
    const processDecrement = (
        currentState: State,
        _passedJumpTable: JumpTable,
    ): State => {
        const { counter, readHead } = currentState;
        return {
            counter: counter - 1,
            readHead: readHead + 1,
        };
    };

    // process "[" while start instruction
    // if counter is 0, jump to end of loop, otherwise advance read head and enter "body"
    const processWhileStart = (
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
    };

    // process "]" while end instruction
    // if counter is not 0, loop back, jump to "[" beginning
    const processWhileEnd = (
        currentState: State,
        passedJumpTable: JumpTable,
    ): State => {
        const { counter, readHead } = currentState;

        // loop back, jump to loop start
        if (counter !== 0) {
            if (!passedJumpTable.has(readHead)) {
                raiseMalformedInput();
            }

            const loopStart: Token = passedJumpTable.get(readHead);
            const startIndex = loopStart.index;

            return { counter, readHead: startIndex };
        }

        // counter === 0; move to next instruction
        return { counter, readHead: readHead + 1 };
    };

    // process "{" if start instruction
    // if counter is 0, jump to end of condition, otherwise advance read head and enter "body"
    const processIfStart = (
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
    };

    // process "}" if end instruction
    // "if" cannot loop back, so just advance read head
    const processIfEnd = (
        currentState: State,
        _passedJumpTable: JumpTable,
    ): State => {
        const { counter, readHead } = currentState;

        return { counter, readHead: readHead + 1 };
    };

    // token type -> State Function. this is the main crux of our code,
    const tokenTypeToTransitionFunction: Record<TokenType, StateFunction> = {
        [TokenType.Print]: processPrint,
        [TokenType.Pass]: processPass,
        [TokenType.Increment]: processIncrement,
        [TokenType.Decrement]: processDecrement,
        [TokenType.WhileStart]: processWhileStart,
        [TokenType.WhileEnd]: processWhileEnd,
        [TokenType.IfStart]: processIfStart,
        [TokenType.IfEnd]: processIfEnd,
    };

    // tokenization. convert characters to tokens for better readability and debugability
    const tokens: Token[] = Array.from(code, (character, index) => {
        // part of tokenization, and for better DX
        const tokenType = {
            "!": TokenType.Print,
            ">": TokenType.Pass,
            "+": TokenType.Increment,
            "-": TokenType.Decrement,
            "[": TokenType.WhileStart,
            "]": TokenType.WhileEnd,
            "{": TokenType.IfStart,
            "}": TokenType.IfEnd,
        };

        const type: TokenType = tokenType[character];

        const token: Token = { type, index };

        return token;
    });

    // process each token, call transition function, return new state
    const processToken = (
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
            const { type, index } = token;
            if (type === TokenType.WhileStart || type === TokenType.IfStart) {
                stack.push(token);
            }
            // do it both ways, jump[start] = end, and jump[end]=start
            else if (type === TokenType.WhileEnd) {
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
            else if (type === TokenType.IfEnd) {
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
        const nextState = processToken(currentToken, globalJumpTable);
        currentState = nextState;
    }

    // return final counter
    return currentState.counter;
};
