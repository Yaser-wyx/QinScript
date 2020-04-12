import {BlockStmt, FunDeclaration, InnerFunDefStmt, ModuleFunDefStmt} from "../../Parser/DataStruct/ASTNode";
import {IDWrap, Variable, VARIABLE_TYPE, VariableMeta} from "./Variable";
import {FunSymbolTable} from "./SymbolTable";
import {printInterpreterError, printWarn} from "../../Log";
import {Complexus} from "./Complexus";

export enum FUN_TYPE {//函数类型
    GENERAL,//普通函数
    STATIC,//静态函数
    INNER//内部函数
}

export type FUN_CLASSES = InnerFun | StaticFun | GeneralFun;

abstract class Fun {
    protected readonly _funBlock?: BlockStmt;//悬挂的函数内部节点
    protected readonly _funName: string;//当前函数名
    protected readonly _moduleName: string;//所处模块名
    protected _paramList: Array<string> = [];//形参名列表
    protected abstract readonly _funType: FUN_TYPE;
    protected _funSymbolTable: FunSymbolTable;//函数符号表，用于存放函数的局部变量，静态变量以及内部函数
    protected _returnValue: any = null;
    protected _rearOperatorList: Array<VariableMeta> = [];//后置运算数量

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

    addRearOperator(rearOperator: VariableMeta) {
        this._rearOperatorList.push(rearOperator);
    }

    subRearOperator(): VariableMeta {
        return <VariableMeta>this._rearOperatorList.pop();
    }

    hasRearOperator() {
        return this._rearOperatorList.length > 0;
    }

    getLocalVariable(varName: string, blockStatement: BlockStmt): Variable | null {
        //获取局部变量
        return this._funSymbolTable.getVariableSymbol(varName, blockStatement);
    }

    pushVariable(blockStatement: BlockStmt, varTypePair: VariableMeta) {
        //添加变量到函数符号表中，函数符号表中的变量均为局部变量
        let variable: Variable = new Variable(this._moduleName);
        variable.initLocalVar(varTypePair, blockStatement);//使用varTypePair来对当前变量进行赋值，varTypePair可能是对变量的一个引用
        this._funSymbolTable.pushSymbol(variable);
    }

    cleanBlockVariable(blockStatement: BlockStmt){
        //清除指定block下的variable
        this._funSymbolTable.clearBlockVariable(blockStatement);
    }

    get returnValue(): any {
        return this._returnValue;
    }

    set returnValue(value: any) {
        this._returnValue = value;
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
    protected readonly _funType: FUN_TYPE = FUN_TYPE.GENERAL;
    get funType(): FUN_TYPE {
        return this._funType;
    }
}

export class InnerFun extends Fun {
    readonly _staticFunName: string = "";//如果是内部函数，则还需要其所属的静态函数名
    protected readonly _funType: FUN_TYPE = FUN_TYPE.INNER;
    protected brotherData: Variable;//在复合体数据中，与该内部函数同级的数据
    /*例如复合体x的数据为：
    {
        a: 123,
        b: "xyz",
        c: {
            d: "qwe",
            e: InnerFun,
            z:{
                q:"123"
               }
        }
    }
    如果调用x.c.e()，那么InnerFun里面的brotherData值为
    {
        d:"qwe",
        e:InnerFun,
        z:{
            q:"123"
           }
    }
    也就是同级属性()
     */
    constructor(moduleName: string, funName: string, funDefNode: FunDeclaration, staticFunName: string, brotherData: Complexus) {
        super(moduleName, funName, funDefNode);
        this._staticFunName = staticFunName;
        //将复合体数据包装为变量
        let value = brotherData;
        let variable = new Variable(moduleName);
        let variableMeta = new VariableMeta(VARIABLE_TYPE.COMPLEXUS, value);
        variable.setValue(variableMeta);
        this.brotherData = variable;
    }

    get staticFunName(): string {
        return this._staticFunName;
    }

    getStaticVariable(): Variable {
        return this.brotherData;
    }

    get funType(): FUN_TYPE {
        return this._funType;
    }
}

export class StaticFun extends Fun {
    protected readonly _funType: FUN_TYPE = FUN_TYPE.STATIC;
    protected _returnValue: VariableMeta;

    get funType(): FUN_TYPE {
        return this._funType;
    }

    constructor(moduleName: string, staticFunName: string, funDefNode: FunDeclaration) {
        super(moduleName, staticFunName, funDefNode);
        this._returnValue = new VariableMeta(VARIABLE_TYPE.COMPLEXUS, new Complexus(moduleName, staticFunName));
    }

    set returnValue(value: VariableMeta) {
        printWarn("静态函数不可以自定义返回值！");
    }

    get returnValue(): VariableMeta {
        return this._returnValue;
    }

    getComplexus() {
        return this._returnValue.value;
    }
}

/**
 * 根据函数的语法树构建fun对象
 * @param FunDefStmt 指定的模块函数语法树
 * @param brotherData 只用在创建内部函数的时候才会传递
 */
//@ts-ignore
export function createFunByFunDefStmt(FunDefStmt: ModuleFunDefStmt | InnerFunDefStmt, brotherData?: Complexus): GeneralFun | StaticFun | InnerFun {
    if (FunDefStmt instanceof ModuleFunDefStmt) {
        if (FunDefStmt.isStatic) {
            return new StaticFun(FunDefStmt.moduleName, FunDefStmt.getFunName(), FunDefStmt.funDeclaration);
        } else {
            return new GeneralFun(FunDefStmt.moduleName, FunDefStmt.getFunName(), FunDefStmt.funDeclaration);
        }
    } else if (brotherData) {
        return new InnerFun(FunDefStmt.moduleName, FunDefStmt.getFunName(), FunDefStmt.funDeclaration, FunDefStmt.staticFunName, brotherData);
    }
    printInterpreterError(FunDefStmt.getFunName() + "函数创建失败！");
}
