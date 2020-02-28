import {Variable} from "./Variable";
import {Fun} from "./Fun";

//符号表，全局唯一
export abstract class SymbolTable {
    protected variableSymbolList: object = {};
    protected funSymbolList: object = {};

    abstract pushVariable(variable: Variable);

    abstract getVariable(moduleName: string, varName: string, funName?: string, blockDepth?: number, blockID?: string): Variable | null;

    abstract pushFun(fun: Fun);

    abstract getFun(moduleName: string, funName: string): Fun | null;
}

class SymbolTableInner extends SymbolTable {

    getVariable(moduleName: string, varName: string, funName?: string, blockDepth?: number, blockID?: string): Variable | null {
        let variable: Variable | null;
        if (funName && blockID && blockDepth) {
            //是函数中的变量
            variable = this.variableSymbolList[moduleName][funName][blockDepth][blockID][varName];
        } else {
            variable = this.variableSymbolList[moduleName][varName];
        }
        //有可能指定位置的变量不存在，也就是空值
        if (variable) {
            return variable;
        } else {
            return null;
        }
    }

    pushFun(fun: Fun) {
        //将函数定义标识符加入到符号表中
        let funModuleName = fun.moduleName;
        let funName = fun.funName;
        if (!this.funSymbolList.hasOwnProperty(funModuleName)) {
            //如果模块不存在，则创建
            this.funSymbolList[funModuleName] = {};
        }
        this.funSymbolList[funModuleName][funName] = fun;
    }

    pushVariable(variable: Variable) {
        let varModuleName = variable.moduleName;
        let varName = variable.variableName;
        if (!this.variableSymbolList.hasOwnProperty(varModuleName)) {
            //如果该模块不存在，则创建
            this.variableSymbolList[varModuleName] = {};
        }
        if (variable.isModuleVar) {
            //如果是模块变量
            this.variableSymbolList[varModuleName][varName] = variable;
        } else {
            //不是模块变量，那么就是一个方法体变量
            //@ts-ignore
            let funName: string = variable.funName;//获取方法名
            //@ts-ignore
            let blockDepth: number = variable.blockDepth;//获取深度
            //@ts-ignore
            let blockID: string = variable.blockID;//获取scopeID
            if (!this.variableSymbolList[varModuleName].hasOwnProperty(funName)) {
                //如果该方法不存在，则创建
                this.variableSymbolList[varModuleName][funName] = new Array<object>();
            }
            if (!this.variableSymbolList[varModuleName][funName][blockDepth].hasOwnProperty(blockID)) {
                //如果指定深度的scope不存在
                this.variableSymbolList[varModuleName][funName][blockDepth][blockID] = {};
            }
            this.variableSymbolList[varModuleName][funName][blockDepth][blockID][varName] = variable;
        }
    }

    getFun(moduleName: string, funName: string): Fun | null {
        let fun: Fun = this.funSymbolList[moduleName][funName];
        if (fun) {
            return fun;
        } else {
            return null;
        }
    }
}


let symbolTable: SymbolTableInner;

export function getSymbolTable(): SymbolTableInner {
    if (!symbolTable) {
        symbolTable = new SymbolTableInner();
    }
    return symbolTable;
}