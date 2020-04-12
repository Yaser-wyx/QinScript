import {VARIABLE_TYPE, VariableMeta} from "../Interpreter/DataStruct/Variable";
import {array, len, print, randomInteger} from "./Core";

export const QSFunMap = {
    print: print,
    len: len,
    randomInteger:randomInteger,
    array:array
};

export function runLib(callee: Function, args: Array<VariableMeta>) {
    let transferredArgs: Array<any> = [];
    args.forEach(arg => {
        //转换参数
        transferredArgs.push(arg.value)
    });
    return callee(transferredArgs);
}