//报错处理程序
import {kill} from "../Utils/utils";
import {LexerToken} from "../Lexer/Datastruct/Token";

let errorNum = 0;

export function hasError(): boolean {
    return errorNum > 0;
}

export function printErr(errMsg) {
    //通用报错打印
    console.error(errMsg)
}

export function printFatalError(errMsg) {
    printErr("====================发生致命错误====================\n" + errMsg);
    errorNum++;
    kill();
}

export function printLexerError(lexerTokens: LexerToken[], file) {
    //词法分析错误
    let errorMsg = "====================发生词法分析错误====================\n";
    for (let index = 0; index < lexerTokens.length; index++) {
        errorMsg += `第${index + 1}个错误：\n`;
        errorMsg += "   错误内容：" + lexerTokens[index].errorMsg + '\n';
        errorMsg += "   错误发生的文件：" + file + '\n';
        errorMsg += "   错误发生的行号：" + lexerTokens[index].lineNo + '\n';
        errorMsg += "   错误发生的位置：" + lexerTokens[index].start + '\n';
        errorMsg += "   错误的Token值：" + lexerTokens[index].value + '\n';
        errorMsg += "   错误的Token长度：" + lexerTokens[index].length + '\n';
        errorMsg += "====================================================\n";
    }
    printErr(errorMsg);
    errorNum += lexerTokens.length;
}

export function printBuildFormError(msg: string) {
    let errorMsg = "====================LR(1)分析表构造错误====================\n";
    errorMsg += msg;
    errorMsg += "====================================================\n";
    printErr(errorMsg);
}