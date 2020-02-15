import * as fs from "fs";
import {printFatalError} from "../error/error";
import {keywordTable} from "./Token";

/**词法分析器工具包
 * 使用正则来判断读入的字符类别
 * 读取指定文件流
 */

export function isNumber(char: string): boolean {
    let number = /[0-9.]/;
    return number.test(char);
}

export function isIDStart(char: string): boolean {
    //是否为标识符的开头
    let string = /[_A-Za-z]/;
    return string.test(char);
}

export function isID(char: string): boolean {
    //是否为标识符中间部分
    let string = /[_A-Za-z0-9]/;
    return string.test(char);
}

export function isSymbol(char: string): boolean {
    //是否是分隔符
    let separator = /[()\[\]{},:;.@=+\-*\/%!&|~<>]/;
    return separator.test(char);
}

export function isSpace(char: string): boolean {
    let space = /[ \f\r\t\v]/;
    return space.test(char);
}

export function isKeyword(char: string): boolean {
    let keyword = keywordTable[char];
    return !!keyword;
}

