import {BlockStmt, FunDeclaration, IDNode} from "../Parser/DataStruct/ASTNode";
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
    private _paramList: Array<string> = [];//形参列表
    private readonly _funType: FUN_TYPE;
    private staticSymbolTable: object = {};

    pushStaticValue(staticValue: Variable | Fun) {
        let symbolName: string;
        if (staticValue instanceof Variable) {
            symbolName = staticValue.variableName;
        } else {
            symbolName = staticValue.funName;
        }
        if (!this.staticSymbolTable.hasOwnProperty(symbolName)) {
            this.staticSymbolTable[symbolName] = staticValue;
        }else{
            console.log("静态变量或内部方法有重名！")
        }
    }

    getStaticValue(symbolName: string): Variable | Fun | null {
        if (this.staticSymbolTable.hasOwnProperty(symbolName)) {
            return this.staticSymbolTable[symbolName];
        }
        return null;
    }

    get funType(): FUN_TYPE {
        return this._funType;
    }

    constructor(moduleName: string, funName: string, funType: FUN_TYPE, funDefNode?: FunDeclaration) {
        this._funName = funName;
        this._moduleName = moduleName;
        this._funType = funType;
        if (funDefNode) {
            this._funBlock = funDefNode.body;
            funDefNode.params.forEach((id: IDNode) => {
                this._paramList.push(id.name);
            })
        }
    }

    setFunDefNode(funDefNode: FunDeclaration) {
        this._funBlock = funDefNode.body;
        funDefNode.params.forEach((id: IDNode) => {
            this._paramList.push(id.name);
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

