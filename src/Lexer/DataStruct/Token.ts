import {T} from "../../Parser/DataStruct/V_T";

export const EOF = '\0';//文件结束标记，供词法分析器使用

export const keywordTable = {//关键字表
    let: T.LET,
    fun: T.FUN,
    import: T.IMPORT,
    export: T.EXPORT,
    module: T.MODULE,
    if: T.IF,
    else: T.ELSE,
    while: T.WHILE,
    return: T.RETURN,
    true: T.TRUE,
    false: T.FALSE,
    null: T.NULL,
    static:T.STATIC
};

export class LexerToken {
    //用于词法分析处理过程中辅助用的Token
    length: number;//token长度
    value: any;//token值
    tokenType: T;//token类型
    //报错信息
    errorMsg?: string;
    start?: number;
    lineNo?: number;

    constructor(length: number, value: any, tokenType: T, errorMsg?: string) {
        this.length = length;
        this.value = value;
        this.tokenType = tokenType;
        this.errorMsg = errorMsg;
    }
}

export class Token {
    tokenType: T;//token的类型
    value: string;//token的值
    start: number;//token在第N行的起始位置
    length: number;//token的长度
    lineNo: number;//token在第几行
    constructor() {
        //初始化token
        this.tokenType = T.NULL;
        this.value = "";
        this.start = 0;
        this.length = 0;
        this.lineNo = 0;
    }
    getTokenTypeValue(){
        //获取type的字符串形式
        return T[this.tokenType];
    }
}

export function createSampleToken(tokenType: T, value: string) {
    let token = new Token();
    token.tokenType = tokenType;
    token.value = value;
    return token;
}
