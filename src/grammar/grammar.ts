import * as ohm from "ohm-js";

const tinyLangGrammar = ohm.grammar(String.raw`
  TinyLangGrammar {
    Program = Statement*

    Statement = Increment | Decrement | WhileLoop | IfStatement | Print | Pass

    Increment = "counter" "+=" "1"
    Decrement = "counter" "-=" "1"

    WhileLoop = "whileNonZero" Block

    IfStatement = "ifNonZero" Block

    Block = "{" Statement* "}"

    Print = "print"

    Pass = "pass"

  }
`);

// semantics, do something with grammar rules
const semantics = tinyLangGrammar.createSemantics();

const emitOperation = {
    Program: (statements) => {
        const array = statements.emit();

        const joined = array.join("");
        return joined;
    },

    _iter: (...children) => {
        const array = children
            .filter((el) => el !== undefined)
            .map((el) => {
                const output = el.emit();
                return output;
            });

        return array;
    },

    Statement: (statement) => {
        // console.log("Statement", { children: statement.children });
        const output = statement.emit();
        return output;
    },

    Increment: (_counter, _plusEquals, _one) => {
        return "+";
    },

    Decrement: (_counter, _minusEquals, _one) => {
        return "-";
    },

    WhileLoop: (_whileNonZero, block) => {
        const blockOutput = block.emit();
        const output = "[" + blockOutput + "]";
        return output;
    },

    Block: (_openBrace, statements, _closingBrace) => {
        const array = statements.emit();

        const joined = array.join("");
        return joined;
    },

    Print: (_printKeyword) => {
        return "!";
    },

    IfStatement: (_ifKeyword, block) => {
        const blockOutput = block.emit();
        const output = "{" + blockOutput + "}";
        return output;
    },

    Pass: (_passKeyword) => {
        return ">";
    },
};

semantics.addOperation("emit", emitOperation);

const userInput = `counter += 1
whileNonZero {
    counter += 1
    pass
    counter -= 1
}
ifNonZero {
    counter -= 1
    print
}
`;
const m = tinyLangGrammar.match(userInput);
console.log({ success: m.succeeded() });

const semanticsResult = semantics(m).emit();
console.log({ semanticsResult });
