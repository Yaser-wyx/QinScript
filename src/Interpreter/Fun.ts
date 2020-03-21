import {BlockStmt, FunDeclaration, ModuleFunDefStmt} from "../Parser/DataStruct/ASTNode";
import {Variable, VarTypePair} from "./Variable";
import {FunSymbolTable} from "./SymbolTable";
import {printInterpreterError} from "../error/error";

export enum FUN_TYPE {//函数类型
    GENERAL,//普通函数
    STATIC,//静态函数
    INNER//内部函数
}

//AST中FunDeclaration的包装类
export class Fun {//普通函数
    private readonly _funBlock?: BlockStmt;//悬挂的函数内部节点
    private readonly _funName: string;//当前函数名
    private readonly _moduleName: string;//所处模块名
    private _paramList: Array<string> = [];//形参名列表
    private readonly _funType: FUN_TYPE;
    private _funSymbolTable: FunSymbolTable;//函数符号表，用于存放函数的局部变量，静态变量以及内部函数
    private _returnValue: any = null;
    private _rearOperator: number = 0;//后置运算数量


    get rearOperator(): number {
        return this._rearOperator;
    }

    addRearOperator() {
        this._rearOperator++;
    }

    subRearOperator() {
        this._rearOperator--;
    }

    constructor(moduleName: string, funName: string, funType: FUN_TYPE, funDefNode?: FunDeclaration) {
        this._funName = funName;
        this._moduleName = moduleName;
        this._funType = funType;
        this._funSymbolTable = new FunSymbolTable();
        if (funDefNode && funDefNode.body && funDefNode.params) {
            this._funBlock = funDefNode.body;
            funDefNode.params.forEach((name: string) => {
                this._paramList.push(name);
            })
        } else {
            printInterpreterError("函数节点缺失，函数构建失败！");
        }
    }

    getVariable(varName: string, blockStatement: BlockStmt) {
        return this._funSymbolTable.getVariable(this._moduleName, varName, blockStatement);
    }

    pushVariable(blockStatement: BlockStmt, varTypePair: VarTypePair) {
        //添加变量到函数符号表中
        let variable: Variable = new Variable(this._moduleName);
        variable.initLocalVar(varTypePair, blockStatement);//使用varTypePair来对当前变量进行赋值，varTypePair可能是对变量的一个引用
        this._funSymbolTable.pushVariable(variable);
    }


    get returnValue(): any {
        return this._returnValue;
    }

    set returnValue(value: any) {
        this._returnValue = value;
    }

    get funType(): FUN_TYPE {
        return this._funType;
    }

    get moduleName(): string {
        return this._moduleName;
    }


    get funBlock(): BlockStmt | null {
        if (this._funBlock)
            return this._funBlock;
        return null;
    }

    get funName(): string {
        return this._funName;
    }

    get paramList(): Array<string> {
        return this._paramList;
    }
}

export function createFunByModuleFunDefStmt(moduleFunDefStmt: ModuleFunDefStmt) {
    let funType: FUN_TYPE = moduleFunDefStmt.isStatic ? FUN_TYPE.STATIC : FUN_TYPE.GENERAL;
    return new Fun(moduleFunDefStmt.moduleName, moduleFunDefStmt.getFunName(), funType, moduleFunDefStmt.funDeclaration);
}
