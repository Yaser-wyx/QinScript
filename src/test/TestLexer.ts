//测试词法分析器
import {getNextToken, hasToken, initLexer} from "../Lexer/Lexer";
import {Token} from "../Lexer/DataStruct/Token";
import {T} from "../Parser/DataStruct/V_T";
import {writeToFile} from "../Utils/utils";
import {PROJECT_DIR, TOKEN_OUT_FILE} from "../Cli/config";


function printToken(token: Token, index: number) {
    let data = "";
    data += "====================第" + index + "个token====================\n";
    data += "token.type: " + T[token.tokenType] + "\n";
    data += "token.value: " + token.value + "\n";
    data += "token.length: " + token.length + "\n";
    data += "token.lineNo: " + token.lineNo + "\n";
    data += "token.start: " + token.start + '\n';
    return data;
}

async function testLexer(filePath) {
    await initLexer(filePath);
    let index = 0;
    let str = "";
    while (hasToken()) {
        index++;
        str += printToken(getNextToken(), index);
    }
    await writeToFile(str, TOKEN_OUT_FILE);
}

testLexer(PROJECT_DIR);