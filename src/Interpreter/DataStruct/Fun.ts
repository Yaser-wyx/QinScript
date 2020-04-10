import {BlockStmt, FunDeclaration, InnerFunDefStmt, ModuleFunDefStmt} from "../../Parser/DataStruct/ASTNode";
import {Variable, VarTypePair} from "./Variable";
import {FunSymbolTable, wrapFunVariableToSymbolKey} from "./SymbolTable";
import {printInterpreterError, printWarn} from "../../Log";
import {Complexus} from "./Complexus";

export enum FUN_TYPE {//函数类型
    GENERAL,//普通函数
    STATIC,//静态函数
    INNER//内部函数
}

abstract class Fun {
    protected readonly _funBlock?: BlockStmt;//悬挂的函数内部节点
    protected readonly _funName: string;//当前函数名
    protected readonly _moduleName: string;//所处模块名
    protected _paramList: Array<string> = [];//形参名列表
    abstract readonly _funType: FUN_TYPE;
    protected _funSymbolTable: FunSymbolTable;//函数符号表，用于存放函数的局部变量，静态变量以及内部函数
    protected _returnValue: any = null;
    protected _rearOperator: number = 0;//后置运算数量

    constructor(moduleName: string, funName: string, funDefNode: FunDeclaration) {
        this._funName = funName;
        this._moduleName = moduleName;
        this._funSymbolTable = new FunSymbolTable(funName);
        if (funDefNode.body && funDefNode.params) {
            this._funBlock = funDefNode.body;
            funDefNode.params.forEach((name: string) => {
                this._paramList.push(name);
            })
        } else {
            printInterpreterError("函数节点缺失，函数构建失败！");
        }
    }

    get rearOperator(): number {
        return this._rearOperator;
    }

    addRearOperator() {
        this._rearOperator++;
    }

    subRearOperator() {
        this._rearOperator--;
    }

    getVariable(varName: string, blockStatement: BlockStmt): Variable | null {
        return this._funSymbolTable.getVariableSymbol(varName, blockStatement);
    }

    pushVariable(blockStatement: BlockStmt, varTypePair: VarTypePair) {
        //添加变量到函数符号表中，函数符号表中的变量均为局部变量
        let variable: Variable = new Variable(this._moduleName);
        variable.initLocalVar(varTypePair, blockStatement);//使用varTypePair来对当前变量进行赋值，varTypePair可能是对变量的一个引用
        this._funSymbolTable.pushSymbol(variable);
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

//AST中FunDeclaration的包装类
export class GeneralFun extends Fun {//函数类
    readonly _funType: FUN_TYPE = FUN_TYPE.GENERAL;
}

export class InnerFun extends Fun {
    readonly _staticFunName: string = "";//如果是内部函数，则还需要其所属的静态函数名
    readonly _funType: FUN_TYPE = FUN_TYPE.INNER;

    constructor(moduleName: string, funName: string, funDefNode: FunDeclaration, staticFunName: string) {
        super(moduleName, funName, funDefNode);
        this._staticFunName = staticFunName;
    }

    get staticFunName(): string {
        return this._staticFunName;
    }
}

export class StaticFun extends Fun {
    readonly _funType: FUN_TYPE = FUN_TYPE.STATIC;
    protected _returnValue: Complexus;

    constructor(moduleName: string, staticFunName: string, funDefNode: FunDeclaration) {
        super(moduleName, staticFunName, funDefNode);
        this._returnValue = new Complexus(moduleName, staticFunName);
    }

    set returnValue(value: Complexus) {
        printWarn("静态函数不可以自定义返回值！");
    }
}

/**
 * 根据函数的语法树构建fun对象
 * @param FunDefStmt 指定的模块函数语法树
 */
export function createFunByFunDefStmt(FunDefStmt: ModuleFunDefStmt | InnerFunDefStmt): GeneralFun | StaticFun | InnerFun {
    if (FunDefStmt instanceof ModuleFunDefStmt) {
        if (FunDefStmt.isStatic) {
            return new StaticFun(FunDefStmt.moduleName, FunDefStmt.getFunName(), FunDefStmt.funDeclaration);
        } else {
            return new GeneralFun(FunDefStmt.moduleName, FunDefStmt.getFunName(), FunDefStmt.funDeclaration);
        }
    } else {
        return new InnerFun(FunDefStmt.moduleName, FunDefStmt.getFunName(), FunDefStmt.funDeclaration, FunDefStmt.staticFunName);
    }
}
