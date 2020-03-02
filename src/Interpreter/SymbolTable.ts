import {Variable} from "./Variable";
import {Fun} from "./Fun";
import {hashCode} from "../Utils/utils";

//符号表，全局唯一
export abstract class SymbolTable {
    protected variableSymbolTable: object = {};
    protected funSymbolTable: object = {};

    abstract pushVariable(variable: Variable);

    abstract getVariable(moduleName: string, varName: string, blockDepth?: number, blockID?: string): Variable | null;

    abstract pushFun(fun: Fun);

    abstract getFun(moduleName: string, funName: string): Fun | null;
}

class SymbolTableInner extends SymbolTable {
    private addedVariableHashSet: Set<number> = new Set<number>();//已经添加的变量的hash值
    private addedFunHashSet: Set<number> = new Set<number>();//已经添加的函数的hash值
    getVariable(moduleName: string, varName: string, blockDepth?: number, blockID?: string): Variable | null {
        if (blockID && blockDepth) {
            //局部变量
            let variableHash = hashCode(moduleName + blockDepth + blockID + varName);
            if (this.addedVariableHashSet.has(variableHash)) {
                return this.variableSymbolTable[moduleName].localVar[blockDepth][blockID][varName];
            } else {
                console.log(varName + "不存在！");
                return null;
            }
        } else {
            //模块变量
            let variableHash = hashCode(moduleName + varName);
            if (this.addedVariableHashSet.has(variableHash)) {
                return this.variableSymbolTable[moduleName].moduleVar[varName];
            } else {
                console.log(varName + "不存在！");
                return null;
            }
        }
    }

    pushFun(fun: Fun) {
        //将函数定义标识符加入到符号表中
        let moduleName = fun.moduleName;
        let funName = fun.funName;
        let funHash = hashCode(moduleName + funName);
        if (this.addedFunHashSet.has(funHash)) {
            console.log(funName + "  该函数已经被定义了！");
        } else {
            if (!this.funSymbolTable[moduleName]) {
                //如果模块不存在，则创建
                this.funSymbolTable[moduleName] = {};
            }
            this.funSymbolTable[moduleName][funName] = fun;
            this.addedFunHashSet.add(funHash)
        }
    }

    pushVariable(variable: Variable) {
        let moduleName = variable.moduleName;
        let varName = variable.variableName;
        if (!this.variableSymbolTable.hasOwnProperty(moduleName)) {
            //如果该模块不存在，则创建
            this.variableSymbolTable[moduleName] = {};
            this.variableSymbolTable[moduleName].moduleVar = {};//模块变量
            this.variableSymbolTable[moduleName].localVar = [];//局部变量
        }
        if (variable.isModuleVar) {
            //如果是模块变量
            let variableHash = hashCode(moduleName + varName);
            if (this.addedVariableHashSet.has(variableHash)) {
                //有相同的变量已经定义了
                //TODO 加入报错系统
                console.log(varName + "变量重复定义")
            } else {
                //没有相同的变量存在
                this.variableSymbolTable[moduleName].moduleVar[varName] = variable;
                this.addedVariableHashSet.add(variableHash);
            }
        } else {
            //不是模块变量，那么就是使用blockID与blockDepth来表示
            //@ts-ignore
            let blockDepth: number = variable.blockDepth;//获取深度
            //@ts-ignore
            let blockID: string = variable.blockID;//获取scopeID
            let variableHash = hashCode(moduleName + blockDepth + blockID + varName);
            if (this.addedVariableHashSet.has(variableHash)) {
                //有相同的变量已经定义了
                //TODO 加入报错系统
                console.log(varName + " 变量重复定义")
            } else {
                //没有相同的变量
                if (!this.variableSymbolTable[moduleName].localVar[blockDepth]) {
                    //如果该深度的block不存在，则创建
                    this.variableSymbolTable[moduleName].localVar[blockDepth] = {};
                }
                if (!this.variableSymbolTable[moduleName].localVar[blockDepth][blockID]) {
                    //如果该指定id的block不存在，则创建
                    this.variableSymbolTable[moduleName].localVar[blockDepth][blockID] = {};
                }
                //添加变量
                this.variableSymbolTable[moduleName].localVar[blockDepth][blockID][varName] = variable;
            }
        }
    }

    getFun(moduleName: string, funName: string): Fun | null {
        let funHash = hashCode(moduleName + funName);
        if (this.addedFunHashSet.has(funHash)) {
            return this.funSymbolTable[moduleName][funName];
        } else {
            //没有指定函数
            //todo 报错
            console.log(funName + "不存在");
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