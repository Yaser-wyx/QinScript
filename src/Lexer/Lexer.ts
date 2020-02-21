//词法分析器
import {EOF, keywordTable, LexerToken, Token, TOKEN_TYPE} from "./Datastruct/Token";
import {isID, isIDStart, isKeyword, isNumber, isSpace, isSymbol} from "../Utils/ScannerUtils";
import {printLexerError} from "../error/error";
import {readFromFile} from "../Utils/utils";

let code: string;//源码
let curCodeIndex: number;//源码指针，指向下一个要读取的字符
let curTokenIndex: number;//token指针，指向下一个要读取的token
let tokens: Array<Token>;//所有token列表
let errorTokens: Array<LexerToken>;//所有出错的token
let lineNo: number;//当前行号
let lineIndex: number;//行中的位置

let createErrorLexerPair = (errMsg, errorString) => {
    return new LexerToken(errorString.length, errorString, TOKEN_TYPE.ERROR, errMsg);
};

function pushToken(lexerToken: LexerToken, token: Token) {
    //将二者合并，push进指定的token列表
    if (lexerToken.tokenType === TOKEN_TYPE.ERROR) {
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
        return new LexerToken(digital.length, Number.parseInt(digital), TOKEN_TYPE.NUMBER);
    } else if (dotCnt === 1) {
        //解析浮点数
        return new LexerToken(digital.length, Number.parseFloat(digital), TOKEN_TYPE.NUMBER);
    } else {
        //错误的数字
        return createErrorLexerPair("数字解析出错，数字中不能有两个及以上的小数点", digital);
    }
}

function handleID(start: string): LexerToken {
    //处理标识符
    let id = start;
    let tokenType = TOKEN_TYPE.ID;//默认是用户自定义标识符
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
    symbolResult = new LexerToken(1, symbol, TOKEN_TYPE.ASSIGN);//默认是等号
    let testNext = (targetSymbolList: string, type: TOKEN_TYPE[]) => {
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
            testNext("=", [TOKEN_TYPE.EQUAL]);
            break;
        case ',':
            symbolResult.tokenType = TOKEN_TYPE.COMMA;
            break;
        case '[':
            symbolResult.tokenType = TOKEN_TYPE.LEFT_BRACKET;
            break;
        case ']':
            symbolResult.tokenType = TOKEN_TYPE.RIGHT_BRACKET;
            break;
        case '{':
            symbolResult.tokenType = TOKEN_TYPE.LEFT_BRACE;
            break;
        case '}':
            symbolResult.tokenType = TOKEN_TYPE.RIGHT_BRACE;
            break;
        case '(':
            symbolResult.tokenType = TOKEN_TYPE.LEFT_PAREN;
            break;
        case ')':
            symbolResult.tokenType = TOKEN_TYPE.RIGHT_PAREN;
            break;
        case ';':
            symbolResult.tokenType = TOKEN_TYPE.SEMI;
            break;
        case '.':
            symbolResult.tokenType = TOKEN_TYPE.DOT;
            break;
        case '@':
            symbolResult.tokenType = TOKEN_TYPE.AT;
            break;
        case '+':
            symbolResult.tokenType = TOKEN_TYPE.ADD;
            break;
        case '-':
            symbolResult.tokenType = TOKEN_TYPE.SUB;
            break;
        case '*':
            symbolResult.tokenType = TOKEN_TYPE.MUL;
            break;
        case '/':
            symbolResult.tokenType = TOKEN_TYPE.DIV;
            break;
        case '%':
            symbolResult.tokenType = TOKEN_TYPE.MOD;
            break;
        case '!':
            symbolResult.tokenType = TOKEN_TYPE.NOT;
            testNext("=", [TOKEN_TYPE.NOT_EQUAL]);
            break;
        case '&':
            symbolResult.tokenType = TOKEN_TYPE.BIT_AND;
            testNext("&", [TOKEN_TYPE.LOGIN_AND]);
            break;
        case '|':
            symbolResult.tokenType = TOKEN_TYPE.BIT_OR;
            testNext("|", [TOKEN_TYPE.LOGIC_OR]);
            break;
        case '~':
            symbolResult.tokenType = TOKEN_TYPE.BIT_NOT;
            break;
        case '>':
            symbolResult.tokenType = TOKEN_TYPE.GREATER;
            testNext("=", [ TOKEN_TYPE.GREATER_EQUAL]);
            break;
        case '<':
            symbolResult.tokenType = TOKEN_TYPE.LESS;
            testNext("=", [ TOKEN_TYPE.LESS_EQUAL]);
            break;
        case ':':
            symbolResult.tokenType = TOKEN_TYPE.COLON;
            break;
        default:
            //正常来说该分支是不会到达的
            symbolResult.tokenType = TOKEN_TYPE.ERROR;
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
            return new LexerToken(string.length, string, TOKEN_TYPE.STRING);
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


function analyzeCodeToToken() {
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
        } else if (isNumber(nowChar)) {
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
        }
        skipSpace();//跳过所有空格
    }
}


export async function initLexer(file: string): Promise<boolean> {
    //初始化词法分析器
    //读取源码文件
    code = await readFromFile(file);
    code += EOF;//在文件末尾添加标记，表示结束
    curCodeIndex = 0;
    curTokenIndex = 0;
    tokens = [];
    lineNo = 1;
    lineIndex = 1;
    errorTokens = [];
    analyzeCodeToToken();
    if (errorTokens.length > 0) {
        printLexerError(errorTokens, file);//打印错误信息
        return false;
    }
    return true;//返回词法解析是否成功
}


export function lookAheadToken(): Token {
    return tokens[curTokenIndex];
}

export function lookAheadXToken(step: number): Token {
    return tokens[curTokenIndex + step - 1];
}

export function hasToken(): boolean {
    return curTokenIndex < tokens.length;
}

export function getNextToken(): Token {
    return tokens[curTokenIndex++];
}