//语法分析器
import {getNextToken, hasToken, initLexer, lookAheadToken} from "../lexer/Lexer";

export async function parser(filePath: string) {
    let initSuccess = await initLexer(filePath);
    if (initSuccess) {
        while (hasToken()) {
            console.log(getNextToken());
        }
    }

}