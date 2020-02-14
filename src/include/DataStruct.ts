//一些特定的数据结构
import {TOKEN_TYPE} from "../lexer/Token";

export class LexerToken {
    //用于词法分析处理过程中的Token
    length: number;//token长度
    value: any;//token值
    tokenType: TOKEN_TYPE;//token类型
    //报错信息
    errorMsg?: string;
    start?: number;
    lineNo?: number;

    constructor(length: number, value: any, tokenType: TOKEN_TYPE, errorMsg?: string) {
        this.length = length;
        this.value = value;
        this.tokenType = tokenType;
        this.errorMsg = errorMsg;
    }

}