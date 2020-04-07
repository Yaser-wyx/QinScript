/*
 * Copyright (c) 2020. yaser. All rights reserved
 * Description: 日志处理
 */

import {kill, writeToFile} from "../Utils/utils";
import {LexerToken, Token} from "../Lexer/DataStruct/Token";
import {FORM_ERROR_FILE} from "../Cli/config";
import {getCurParsingModuleInfo} from "../Parser/ParseModule";
import {getCurRunningModule} from "../Interpreter";

let colors = require('colors');

let errorNum = 0;

export function hasError(): boolean {
    return errorNum > 0;
}

function getTime(): string {
    return new Date().toLocaleString() + "        ";
}

export function Log(...text) {
    for (let i = 0; i < text.length; i++) {
        console.log(text[i])
    }
}

export function printErr(errMsg) {
    //通用报错打印
    errMsg = getTime() + errMsg;
    console.log(errMsg.red)
}

export function printWarn(warnMsg) {
    //通用警告打印
    warnMsg = getTime() + warnMsg;
    console.log(warnMsg.yellow);
}

export function printInfo(info, needTime = true) {
    //通用日志信息打印
    if (needTime)
        info = getTime() + info;
    console.log(info.green);
}

export function printFatalError(errMsg) {
    printErr("\n====================发生致命错误====================\n" + errMsg);
    kill();
}

export function printLexerError(lexerTokens: LexerToken[], file) {
    //词法分析错误
    let errorMsg = "\n====================发生词法分析错误====================\n";
    const parsingModule = getCurParsingModuleInfo();
    errorMsg += `错误模块：${parsingModule.moduleName}\n`;
    errorMsg += `错误模块路径：${parsingModule.path}\n`;
    for (let index = 0; index < lexerTokens.length; index++) {
        errorMsg += `第${index + 1}个错误：\n`;
        errorMsg += "   错误内容：" + lexerTokens[index].errorMsg + '\n';
        errorMsg += "   错误发生的文件：" + file + '\n';
        errorMsg += "   错误发生的行号：" + lexerTokens[index].lineNo + '\n';
        errorMsg += "   错误发生的位置：" + lexerTokens[index].start + '\n';
        errorMsg += "   错误的Token值：\"" + lexerTokens[index].value + '\"\n';
        errorMsg += "   错误的Token长度：" + lexerTokens[index].length + '\n';
        errorMsg += "====================================================\n";
    }
    printErr(errorMsg);
    errorNum += lexerTokens.length;
}

let formError = "";
let formErrorNum = 0;

export function addBuildFormError(error) {
    formError += error;
    formErrorNum++;
}

export function printBuildFormError() {
    if (formErrorNum > 0) {
        printWarn("分析表有" + formErrorNum + "个冲突，请查看日志！");
        let errorMsg = "\n====================LR(1)分析表构造错误====================\n";
        errorMsg += formError;
        errorMsg += "====================================================\n";
        writeToFile(errorMsg, FORM_ERROR_FILE)
    } else {
        printInfo("分析表无冲突！");
        writeToFile("无异常！", FORM_ERROR_FILE)
    }
    formErrorNum = 0;
    formError = "";
}

export function printParseModuleError(Token: Token, formItemErrorMsg: string) {
    let errorMsg = "\n====================发生语法分析错误====================\n";
    const parsingModule = getCurParsingModuleInfo();
    errorMsg += `错误模块：${parsingModule.moduleName}\n`;
    errorMsg += `错误模块路径：${parsingModule.path}\n`;
    errorMsg += "分析表错误信息：\n";
    errorMsg += "   " + formItemErrorMsg + "\n";
    errorMsg += "错误的Token信息：\n";
    errorMsg += "   错误发生的行号：" + Token.lineNo + '\n';
    errorMsg += "   错误发生的位置：" + Token.start + '\n';
    errorMsg += "   错误的Token值：\"" + Token.value + '\"\n';
    errorMsg += "   错误的Token长度：" + Token.length + '\n';
    errorMsg += "====================================================\n";
    printErr(errorMsg);
}

export function printBuildASTError(ASTError: string, lineNo?: number) {
    let errorMsg = "====================语法树构建错误====================\n";
    const parsingModule = getCurParsingModuleInfo();
    errorMsg += `出错模块：${parsingModule.moduleName}\n`;
    errorMsg += `错误模块路径：${parsingModule.path}\n`;
    if (lineNo) {
        errorMsg += `错误行号：${lineNo}\n`
    }
    errorMsg += "语法树构建错误信息：\n";
    errorMsg += "   " + ASTError + "\n";
    errorMsg += "====================================================\n";
    printFatalError(errorMsg);
}

export function printInterpreterError(interpreterError: string, lineNo?: number) {
    let errorMsg = "====================解释器运行期错误====================\n";
    const runningModule = getCurRunningModule();
    if (runningModule) {
        errorMsg += `出错模块：${runningModule}\n`;
    }
    if (lineNo) {
        errorMsg += `错误行号：${lineNo}\n`
    }
    errorMsg += "错误信息：\n";
    errorMsg += "   " + interpreterError + "\n";
    errorMsg += "====================================================\n";
    printFatalError(errorMsg);
}