import {Variable} from "./Variable";
import {Fun} from "./Fun";
import {hashCode} from "../Utils/utils";
import {BlockStmt} from "../Parser/DataStruct/ASTNode";
import {printInterpreterError} from "../error/error";

//符号表抽象类
abstract class SymbolTable {
    protected variableSymbolTable: object = {};
    protected addedVariableHashSet: Set<number> = new Set<number>();//已经添加的变量的hash值
    protected addedFunHashSet: Set<number> = new Set<number>();//已经添加的函数的hash值

    abstract pushVariable(variable: Variable);

    abstract getVariable(moduleName: string, varName: string, block?: BlockStmt): Variable | null;

    abstract pushFun(funName: string, moduleName?: string);

    abstract hasFun(funName: string, moduleName?: string): boolean;

}

//函数符号表，用于存局部变量、函数参数变量、静态变量以及内部函数。
export class FunSymbolTable extends SymbolTable {

    getVariable(moduleName: string, varName: string, block: BlockStmt): Variable | null {
        //查找局部变量
        let curBlock: BlockStmt | null = block;
        while (curBlock) {
            //如果当前block存在
            let variableHash = hashCode(curBlock.blockDepth + curBlock.blockID + varName);
            if (this.addedVariableHashSet.has(variableHash)) {
                //可以直接获取，返回获取的结果数据
                return this.variableSymbolTable[curBlock.blockDepth][curBlock.blockID][varName];
            }
            curBlock = curBlock.fatherBlock;//查看父block
        }
        return null;
    }


    pushVariable(variable: Variable) {
        let varName = variable.variableName;
        //不是模块变量，那么就是使用blockID与blockDepth来表示
        //@ts-ignore
        let blockDepth: number = variable.blockDepth;//获取深度
        //@ts-ignore
        let blockID: string = variable.blockID;//获取blockID
        let variableHash = hashCode(blockDepth + blockID + varName);
        if (this.addedVariableHashSet.has(variableHash)) {
            //有相同的变量已经定义了
            printInterpreterError(varName + " 变量重复定义")
        } else {
            //没有相同的变量
            if (!this.variableSymbolTable[blockDepth]) {
                //如果该深度的block不存在，则创建
                this.variableSymbolTable[blockDepth] = {};
            }
            if (!this.variableSymbolTable[blockDepth][blockID]) {
                //如果该指定id的block不存在，则创建
                this.variableSymbolTable[blockDepth][blockID] = {};
            }
            //添加变量
            this.variableSymbolTable[blockDepth][blockID][varName] = variable;
            this.addedVariableHashSet.add(variableHash);
        }
    }

    hasFun(): boolean {
        return false;
    }

    pushFun(funName: string) {

    }
}

//全局符号表，用于存放模块函数与模块变量
export class GlobalSymbolTable extends SymbolTable {

    getVariable(moduleName: string, varName: string): Variable | null {
        //获取模块变量
        let variableHash = hashCode(moduleName + varName);
        if (this.addedVariableHashSet.has(variableHash)) {
            return this.variableSymbolTable[moduleName][varName];
        } else {
            return null;
        }
    }

    pushFun(funName, moduleName) {
        //将函数定义标识符加入到符号表中
        let funHash = hashCode(moduleName + funName);
        if (this.addedFunHashSet.has(funHash)) {
            printInterpreterError(funName + "在模块：" + moduleName + "中重复定义！");
        } else {
            this.addedFunHashSet.add(funHash);
        }
    }
    //是否存在函数
    hasFun(funName, moduleName): boolean {
        let funHash = hashCode(moduleName + funName);
        return this.addedFunHashSet.has(funHash);
    }

    pushVariable(variable: Variable) {
        let moduleName = variable.moduleName;
        let varName = variable.variableName;
        if (!this.variableSymbolTable.hasOwnProperty(moduleName)) {
            //如果该模块不存在，则创建
            this.variableSymbolTable[moduleName] = {};//模块变量
        }
        let variableHash = hashCode(moduleName + varName);//获取hash值
        if (this.addedVariableHashSet.has(variableHash)) {
            //有相同的变量已经定义了
            printInterpreterError(varName + "在模块：" + moduleName + "中重复定义！");
        } else {
            //没有相同的变量存在
            this.variableSymbolTable[moduleName][varName] = variable;
            this.addedVariableHashSet.add(variableHash);
        }

    }
}

let globalSymbolTable: GlobalSymbolTable;//全局符号表

export function getGlobalSymbolTable(): GlobalSymbolTable {
    if (!globalSymbolTable) {
        globalSymbolTable = new GlobalSymbolTable();
    }
    return globalSymbolTable;
}