import {Variable} from "./Variable";
import {hashCode} from "../../Utils/utils";
import {BlockStmt} from "../../Parser/DataStruct/ASTNode";
import {Log, printFatalError, printInterpreterError} from "../../Log";

//符号表抽象类
abstract class SymbolTable {
    protected variablesValue: object = {};

    protected symbolsSet: Set<string> = new Set<string>();//存symbol的hash值
    // 如果是变量，那么value就是该变量在variablesValue里面的索引
    // 如果是函数，那么value不存值，直接为统一值-1，只用来表示是否存在

    /**
     *
     * @param varOrModuleName 可能是变量，也可能是模块名
     * @param funName 如果存在，就是函数名
     */
    abstract pushSymbol(varOrModuleName: Variable | string, funName?: string);


    abstract getVariableSymbol(varOrModuleName: string, blockOrVarName?: BlockStmt | string): Variable | null ;
}


//函数符号表，用于存局部变量、函数参数变量。
export class FunSymbolTable extends SymbolTable {
    private readonly funName: string;//符号表所属的函数名

    constructor(funName: string) {
        super();
        this.funName = funName;
    }

    pushSymbol(variableOrStaticFun: Variable | string, innerFun?: string) {
        if (variableOrStaticFun instanceof Variable) {
            let varName = variableOrStaticFun.variableName;
            //使用blockID与blockDepth来表示
            //@ts-ignore
            let blockDepth: number = variableOrStaticFun.blockDepth;//获取深度
            //@ts-ignore
            let blockID: string = variableOrStaticFun.blockID;//获取blockID
            let variableHash = wrapFunVariableToSymbolKey(blockDepth, blockID, varName);
            if (this.symbolsSet.has(variableHash)) {
                //有相同的变量已经定义了
                printInterpreterError(`${varName}变量在函数${this.funName}下重复定义！`);
            } else {
                //没有相同的变量
                if (!this.variablesValue[blockDepth]) {
                    //如果该深度的block不存在，则创建
                    this.variablesValue[blockDepth] = {};
                }
                if (!this.variablesValue[blockDepth][blockID]) {
                    //如果该指定id的block不存在，则创建
                    this.variablesValue[blockDepth][blockID] = {};
                }
                //添加变量
                this.variablesValue[blockDepth][blockID][varName] = variableOrStaticFun;
                this.symbolsSet.add(variableHash);
            }
        } else if (innerFun) {
            //加入内部函数
            let funHash = wrapModuleSymbolToSymbolKey(variableOrStaticFun, innerFun);
            if (this.symbolsSet.has(funHash)) {
                printFatalError(innerFun + "在静态函数：" + variableOrStaticFun + "中重复定义！");
            } else {
                this.symbolsSet.add(funHash);
            }
        }
    }

    getVariableSymbol(varName: string, block: BlockStmt): Variable | null {
        //函数下的符号表用于查找局部变量
        let curBlock: BlockStmt | null = block;
        while (curBlock) {
            //如果当前block存在
            let variableHash = wrapFunVariableToSymbolKey(curBlock.blockDepth, curBlock.blockID, varName);
            if (this.symbolsSet.has(variableHash)) {
                //可以直接获取，返回获取的结果数据
                return this.variablesValue[curBlock.blockDepth][curBlock.blockID][varName];
            }
            curBlock = curBlock.fatherBlock;//查看父block
        }
        return null;
    }

    clearBlockVariable(block: BlockStmt) {
        let blockDepth: number = block.blockDepth;//获取深度
        let blockID: string = block.blockID;//获取blockID
        if (this.variablesValue[blockDepth]) {
            //如果该层block存在变量，那么进行清除操作
            const varNames = Object.keys(this.variablesValue[blockDepth][blockID]);//获取所有要清除的变量名
            for (let i = 0; i < varNames.length; i++) {
                const varName = varNames[i];
                let variableHash = wrapFunVariableToSymbolKey(blockDepth, blockID, varName);
                this.symbolsSet.delete(variableHash);//从set中删除
            }

            delete this.variablesValue[blockDepth][blockID];

        }
    }
}

//全局符号表，用于存放模块函数与模块变量
export class GlobalSymbolTable extends SymbolTable {

    pushSymbol(varOrModuleName: Variable | string, funName?: string) {
        if (varOrModuleName instanceof Variable) {
            let moduleName = varOrModuleName.moduleName;
            let varName = varOrModuleName.variableName;
            let variableHash = wrapModuleSymbolToSymbolKey(moduleName, varName);//获取hash值
            if (this.symbolsSet.has(variableHash)) {
                //有相同的变量已经定义了
                printFatalError(varName + "在模块：" + moduleName + "中重复定义！");
            } else {
                //没有相同的变量存在
                if (!this.variablesValue[moduleName]) {
                    //如果该模块不存在，则创建
                    this.variablesValue[moduleName] = {};//模块变量
                }
                this.variablesValue[moduleName][varName] = varOrModuleName;
                this.symbolsSet.add(variableHash);
            }
        } else if (funName) {
            //将函数定义标识符加入到符号表中
            let funHash = wrapModuleSymbolToSymbolKey(varOrModuleName, funName);
            if (this.symbolsSet.has(funHash)) {
                printFatalError(funName + "在模块：" + varOrModuleName + "中重复定义！");
            } else {
                this.symbolsSet.add(funHash);
            }
        } else {
            printFatalError("pushSymbol的参数匹配不正确！");
        }
    }

    getVariableSymbol(moduleName: string, varName: string): Variable | null {
        //获取模块变量
        let variableHash = wrapModuleSymbolToSymbolKey(moduleName, varName);//获取hash值
        if (this.symbolsSet.has(variableHash)) {
            return this.variablesValue[moduleName][varName];
        } else {
            return null;
        }
    }
}

let globalSymbolTable: GlobalSymbolTable | null;//全局符号表

const SPLIT = ";";

/**
 * 将标识符信息转化为符号表的key
 * @param symbolsInfo 用于标识该标识符所需要的的所有信息
 */
function wrapToSymbolKey(...symbolsInfo: (number | string)[]): string {
    let symbolsKey = "";
    for (let i = 0; i < symbolsInfo.length; i++) {
        const symbolInfo: number | string = symbolsInfo[i];
        symbolsKey += symbolInfo + SPLIT;//必须要一个间隔符，否则可能会出现不同标识符的标识信息一样
        // 例如1.2.3如果没有分隔符，那么与1.23是一样的。
    }
    return hashCode(symbolsKey).toString();
}

export function wrapFunVariableToSymbolKey(blockDepth, blockID, varName): string {
    return wrapToSymbolKey(blockDepth, blockID, varName);
}

export function wrapModuleSymbolToSymbolKey(moduleName, varOrFunName): string {
    return wrapToSymbolKey(moduleName, varOrFunName);
}

export function getGlobalSymbolTable(): GlobalSymbolTable {
    if (!globalSymbolTable) {
        globalSymbolTable = new GlobalSymbolTable();
    }
    return globalSymbolTable;
}

export function cleanGlobalSymbolTable() {
    globalSymbolTable = null;
}