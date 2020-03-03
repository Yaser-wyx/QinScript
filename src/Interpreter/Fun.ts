import {BlockStmt, FunDeclaration} from "../Parser/DataStruct/ASTNode";
import {Variable} from "./Variable";

export enum FUN_TYPE {//函数类型
    GENERAL,//普通函数
    STATIC,//静态函数
    INNER//内部函数
}

//AST中FunDeclaration的包装类
export class Fun {//普通函数
    private _funBlock?: BlockStmt;//悬挂的函数内部节点
    private readonly _funName: string;//当前函数名
    private readonly _moduleName: string;//所处模块名
    private _paramList: Array<string> = [];//形参名列表
    private readonly _funType: FUN_TYPE;
    private _staticSymbolTable: object = {};
    private _easySymbolTable:object={};//简易符号表，用于存放形参对应的数据
    private _isReturn:boolean=false;
    pushStaticValue(staticValue: Variable | Fun) {
        let symbolName: string;
        if (staticValue instanceof Variable) {
            symbolName = staticValue.variableName;
        } else {
            symbolName = staticValue.funName;
        }
        if (!this._staticSymbolTable.hasOwnProperty(symbolName)) {
            this._staticSymbolTable[symbolName] = staticValue;
        }else{
            console.log("静态变量或内部方法有重名！")
        }
    }

    getStaticValue(symbolName: string): Variable | Fun | null {
        if (this._staticSymbolTable.hasOwnProperty(symbolName)) {
            return this._staticSymbolTable[symbolName];
        }
        return null;
    }

    get isReturn(): boolean {
        return this._isReturn;
    }

    set isReturn(value: boolean) {
        this._isReturn = value;
    }

    get funType(): FUN_TYPE {
        return this._funType;
    }



    set staticSymbolTable(value: object) {
        this._staticSymbolTable = value;
    }

    getVariableFromEasySymbolTable(varName:string): Variable {

        return this._easySymbolTable[varName];
    }

    set easySymbolTable(value: object) {
        this._easySymbolTable = value;
    }

    constructor(moduleName: string, funName: string, funType: FUN_TYPE, funDefNode?: FunDeclaration) {
        this._funName = funName;
        this._moduleName = moduleName;
        this._funType = funType;
        if (funDefNode) {
            this._funBlock = funDefNode.body;
            funDefNode.params.forEach((name: string) => {
                this._paramList.push(name);
            })
        }
    }

    setFunDefNode(funDefNode: FunDeclaration) {
        this._funBlock = funDefNode.body;
        funDefNode.params.forEach((id: string) => {
            this._paramList.push(id);
        })
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

