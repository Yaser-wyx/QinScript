//QS核心库


import {Complexus} from "../Interpreter/DataStruct/Complexus";
import {InnerFunDefStmt} from "../Parser/DataStruct/ASTNode";

export function print(args: Array<any>) {
    let value = "";
    const baseType = new Set(['string', 'number', 'boolean']);
    const replacer = (key, value) => {
        if (value instanceof InnerFunDefStmt) {
            value = "InnerFun";
        } else if (value instanceof Complexus) {
            value = value.data;
        }

        return value;
    }
    args.forEach(datum => {
        if (baseType.has(typeof datum)) {
            value += datum + " ";
        } else {
            value += JSON.stringify(datum, replacer, 4) + " ";
        }
    });
    console.log(value);
}

export function len(arg: Array<any>) {
    return arg[0].length;
}

//两个参数，第一个为开始，第二个为结束
export function randomInteger(args: Array<any>) {
    let start = args[0];
    let end = args[1];
    return Math.round(Math.random() * (end - start) + start);

}

export function array(args: Array<any>) {
    let len = args[0];
    let initValue = args[1];
    if (initValue === undefined) {
        initValue = 0;
    }
    let array = new Array(len);
    for (let i = 0; i < len; i++) {
        array[i] = initValue;
    }
    return array;
}