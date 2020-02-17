//测试词法分析器
import {getNextToken, hasToken, initLexer} from "../Lexer/Lexer";
import {Token, TOKEN_TYPE} from "../Lexer/Token";


function printToken(token: Token, index: number) {
    console.log("====================第" + index + "个token====================");
    console.log("token.type: " + TOKEN_TYPE[token.tokenType]);
    console.log("token.value: " + token.value);
    console.log("token.length: " + token.length);
    console.log("token.lineNo: " + token.lineNo);
    console.log("token.start: " + token.start + '\n');
}
async function testLexer(filePath) {
    await initLexer(filePath);
    let index = 0;
    while (hasToken()) {
        index++;
        printToken(getNextToken(), index);
    }

}

testLexer("src/test.qs");