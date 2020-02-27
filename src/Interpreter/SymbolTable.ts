import {Variable} from "./Variable";

export abstract class SymbolTable {
    protected variableSymbolList: object={};
    protected callSymbolList: object={};
    pushVariable(variable: Variable){}
}

class SymbolTableInner extends SymbolTable {

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
            let scopeDepth: number = variable.scopeDepth;//获取深度
            //@ts-ignore
            let scopeID: string = variable.scopeID;//获取scopeID
            if (!this.variableSymbolList[varModuleName].hasOwnProperty(funName)) {
                //如果该方法不存在，则创建
                this.variableSymbolList[varModuleName][funName] = new Array<object>();
            }
            if (!this.variableSymbolList[varModuleName][funName][scopeDepth].hasOwnProperty(scopeID)) {
                //如果指定深度的scope不存在
                this.variableSymbolList[varModuleName][funName][scopeDepth][scopeID] = {};
            }
            this.variableSymbolList[varModuleName][funName][scopeDepth][scopeID][varName] = variable;
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