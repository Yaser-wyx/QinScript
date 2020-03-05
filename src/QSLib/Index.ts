import {VarTypePair} from "../Interpreter/Variable";
import {print} from "./Core";

export const QSFunMap = {
    print: print
};

export function runLib(callee: Function, args: Array<VarTypePair>) {
    let transferredArgs: Array<any> = [];
    args.forEach(arg => {
        //转换参数
        transferredArgs.push(arg.value)
    });
    callee(transferredArgs);
}