/*
 * Copyright (c) 2020. yaser. All rights reserved
 * Description:词法分析器
 */

import {EOF, keywordTable, LexerToken, Token} from "./DataStruct/Token";
import {isID, isIDStart, isKeyword, isNumber, isNumberStart, isSpace, isSymbol} from "./ScannerUtils";
import {printErr, printInfo, printLexerError} from "../Log";
import {readFromFile} from "../Utils/utils";
import {T} from "./DataStruct/V_T";
import {printTokens} from "./PrintToken";

let code: string;//源码
let curCodeIndex: number;//源码指针，指向下一个要读取的字符
let tokens: Array<Token>;//所有token列表
let usedToken: Array<Token>;//用于保存已使用过的Token，但至多只保存两个，一个是前一个token，另一个是当前的token
let errorTokens: Array<LexerToken>;//所有出错的token
let lineNo: number;//当前行号
let lineIndex: number;//行中的位置

let createErrorLexerPair = (errMsg, errorString) => {
    return new LexerToken(errorString.length, errorString, T.ERROR, errMsg);
};

function pushToken(lexerToken: LexerToken, token: Token) {
    //将二者合并，push进指定的token列表
    if (lexerToken.tokenType === T.ERROR) {
        //错误的token
        lexerToken.lineNo = token.lineNo;
        lexerToken.start = token.start;
        errorTokens.push(lexerToken);
    } else {
        token.length = lexerToken.length;
        token.value = lexerToken.value;
        token.tokenType = lexerToken.tokenType;
        tokens.push(token);
    }
}

function lookAheadChar(): string {
    //向前看一个单词
    return code[curCodeIndex];
}

function lookAheadXChar(x: number): string {
    //返回向前看的x个字符
    return code.substr(curCodeIndex, x);
}


function getNextChar(): string {
    //获取一个单词
    lineIndex++;
    return code[curCodeIndex++];
}

function handleNumber(start: string): LexerToken {
    //处理数字
    let digital = start;
    let dotCnt = 0;
    while (isNumber(lookAheadChar())) {
        let char = getNextChar();
        if (char === '.') dotCnt++;
        digital += char;
    }
    if (dotCnt === 0) {
        //解析整数
        return new LexerToken(digital.length, Number.parseInt(digital), T.NUMBER);
    } else if (dotCnt === 1) {
        //解析浮点数
        return new LexerToken(digital.length, Number.parseFloat(digital), T.NUMBER);
    } else {
        //错误的数字
        return createErrorLexerPair("数字解析出错，数字中不能有两个及以上的小数点", digital);
    }
}

function handleID(start: string): LexerToken {
    //处理标识符
    let id = start;
    let tokenType = T.ID;//默认是用户自定义标识符
    while (isID(lookAheadChar())) {
        id += getNextChar();
    }
    if (isKeyword(id)) {
        tokenType = keywordTable[id];
    }
    return new LexerToken(id.length, id, tokenType);
}

function handleSymbol(start: string): LexerToken {
    let symbol = start;
    let symbolResult: LexerToken;
    symbolResult = new LexerToken(1, symbol, T.ASSIGN);//默认是等号
    let testNext = (targetSymbolList: string, type: T[]) => {
        //从targetSymbolList中测试下一个符号是否为其中的符号，如果是的话，则读入，并重置结果，否则不做操作
        let nextChar = lookAheadChar();
        let index = targetSymbolList.indexOf(nextChar);
        if (index !== -1) {
            //如果存在
            symbol += getNextChar();
            symbolResult.tokenType = type[index];
            symbolResult.length = symbol.length;
            symbolResult.value = symbol;
        }
    };
    switch (symbol) {
        //单独修改token类型
        case '=':
            testNext("=", [T.EQUAL]);
            break;
        case ',':
            symbolResult.tokenType = T.COMMA;
            break;
        case '[':
            symbolResult.tokenType = T.LEFT_BRACKET;
            break;
        case ']':
            symbolResult.tokenType = T.RIGHT_BRACKET;
            break;
        case '{':
            symbolResult.tokenType = T.LEFT_BRACE;
            break;
        case '}':
            symbolResult.tokenType = T.RIGHT_BRACE;
            break;
        case '(':
            symbolResult.tokenType = T.LEFT_PAREN;
            break;
        case ')':
            symbolResult.tokenType = T.RIGHT_PAREN;
            break;
        case ';':
            symbolResult.tokenType = T.SEMI;
            break;
        case '.':
            symbolResult.tokenType = T.DOT;
            break;
        case '@':
            symbolResult.tokenType = T.AT;
            break;
        case '+':
            symbolResult.tokenType = T.ADD;
            testNext("+", [T.ADD_ONE]);
            break;
        case '-':
            symbolResult.tokenType = T.SUB;
            testNext("-", [T.SUB_ONE]);
            break;
        case '*':
            symbolResult.tokenType = T.MUL;
            break;
        case '/':
            symbolResult.tokenType = T.DIV;
            break;
        case '%':
            symbolResult.tokenType = T.MOD;
            break;
        case '!':
            symbolResult.tokenType = T.NOT;
            testNext("=", [T.NOT_EQUAL]);
            break;
        case '&':
            symbolResult.tokenType = T.BIT_AND;
            testNext("&", [T.LOGIC_AND]);
            break;
        case '|':
            symbolResult.tokenType = T.BIT_OR;
            testNext("|", [T.LOGIC_OR]);
            break;
        case '~':
            symbolResult.tokenType = T.BIT_NOT;
            break;
        case '>':
            symbolResult.tokenType = T.GREATER;
            testNext("=", [T.GREATER_EQUAL]);
            break;
        case '<':
            symbolResult.tokenType = T.LESS;
            testNext("=", [T.LESS_EQUAL]);
            break;
        case ':':
            symbolResult.tokenType = T.COLON;
            testNext(":", [T.MODULE_SCOPE]);
            break;
        default:
            //正常来说该分支是不会到达的
            symbolResult.tokenType = T.ERROR;
            symbolResult.errorMsg = "非法的运算法";
    }
    return symbolResult;
}

function skipSpace() {
    while (isSpace(lookAheadChar())) {
        getNextChar();
    }
}

function handleString(): LexerToken {
    //处理字符串
    let string = "";
    while (true) {
        let nextChar = lookAheadChar();
        if (nextChar === '\"') {
            //结束字符串解析
            getNextChar();//读取掉右"
            return new LexerToken(string.length, string, T.STRING);
        }
        if (nextChar === EOF) {
            //报错
            return createErrorLexerPair("字符串缺少右引号", string);
        }
        string += getNextChar();
    }
}

function skipAnnotation(start: string): boolean | LexerToken {

    let nextChar = getNextChar();
    if (nextChar === '*') {
        let annotation = start + nextChar;
        //处理多行注释
        while (lookAheadXChar(2) !== '*/' && lookAheadChar() !== EOF) {
            //读取注释内容
            annotation += getNextChar();
        }
        if (lookAheadXChar(2) === '*/') {
            //将收尾读取
            getNextChar();
            getNextChar();
        } else {
            //没有结尾的*/需要报错
            return createErrorLexerPair("多行注释需要使用 '*/' 结尾！", annotation);
        }
    } else {
        //处理单行注释
        while (lookAheadChar() !== '\n' && lookAheadChar() !== EOF) {
            //读取注释内容
            getNextChar();
        }
    }
    return true;
}


function convertCodeToToken() {
    //读取源代码文件，并识别全部的token，保存到tokens数组中
    let nowChar: string;
    let token: Token;
    skipSpace();//跳过所有空格
    while (lookAheadChar() !== EOF) {
        token = new Token();
        token.lineNo = lineNo;
        token.start = lineIndex;
        nowChar = getNextChar();//读取一个字符
        let next = lookAheadChar();
        if (nowChar === '/' && (next === '/' || next === '*')) {
            //跳过注释
            let result = skipAnnotation(nowChar);
            if (typeof result !== "boolean") {
                pushToken(result, token)
            }
        } else if (isNumberStart(nowChar)) {
            //处理数字（包括正整数与浮点数）
            pushToken(handleNumber(nowChar), token);
        } else if (isIDStart(nowChar)) {
            //处理标识符，标识符是字母或下划线开头
            pushToken(handleID(nowChar), token);
        } else if (isSymbol(nowChar)) {
            //处理各种符号
            pushToken(handleSymbol(nowChar), token);
        } else if (nowChar === "\"") {
            //处理字符串
            pushToken(handleString(), token);
        } else if (nowChar === '\n') {
            //换行符
            lineNo++;
            lineIndex = 1;
        } else {
            pushToken(createErrorLexerPair("无法识别的Token", nowChar), token);
        }
        skipSpace();//跳过所有空格
    }
}

export async function initLexer(filePath: string): Promise<boolean> {
    //初始化词法分析器
    //读取源码文件
    printInfo("初始化词法分析器...");
    printInfo("读取源码文件...");
    usedToken = [];
    code = await readFromFile(filePath);
    code += EOF;//在文件末尾添加标记，表示结束
    curCodeIndex = 0;
    tokens = [];
    lineNo = 1;
    lineIndex = 1;
    errorTokens = [];
    printInfo("解析Token...");
    convertCodeToToken();
    printInfo("Token解析完成！");
    let EOFToken = new Token();
    EOFToken.tokenType = T.EOF;
    EOFToken.value = "#";
    tokens.push(EOFToken);
    printTokens(tokens, filePath);
    if (errorTokens.length > 0) {
        printLexerError(errorTokens, filePath);//打印错误信息
        return false;
    }
    return true;//返回词法解析是否成功
}


export function lookAheadToken(): Token {
    return tokens[0];
}

export function getPreToken(): Token | null {
    if (usedToken.length < 2) {//如果长度小于2，则表示没有前一个token，只有当前的token
        return null;
    }
    return usedToken[0];
}

export function getNextToken(): Token {
    // @ts-ignore
    const nowToken = tokens.shift()
    // @ts-ignore
    usedToken.push(nowToken);
    if (usedToken.length > 2) {//usedToken的长度永远小于等于2，当长度为2时，第1个为前一个token，第2个为当前token
        usedToken.shift();
    }
    // @ts-ignore
    return nowToken;
}