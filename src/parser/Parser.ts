//语法分析器
import {getNextToken, hasToken, initLexer} from "../lexer/Lexer";
export async function parser(filePath: string) {
    let initSuccess = await initLexer(filePath);
    if (initSuccess) {
        while (hasToken()) {
            console.log(getNextToken());
        }
    }
}
