import {VarTypePair} from "../Interpreter/DataStruct/Variable";
import {len, print} from "./Core";

export const QSFunMap = {
    print: print,
    len: len,
};

export function runLib(callee: Function, args: Array<VarTypePair>) {
    let transferredArgs: Array<any> = [];
    args.forEach(arg => {
        //转换参数
        transferredArgs.push(arg.value)
    });
    return callee(transferredArgs);
}