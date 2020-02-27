//变量包装类
import {VarDefStmt} from "../Parser/DataStruct/AST";

export class Variable {
    private readonly _variableName: string;//变量名
    variableValue: any = undefined;//变量值
    private readonly _varDecNode: VarDefStmt;//变量定义节点
    //是否定义了，因为所有变量会在生成语法树的时候加入到符号表中，此时只是占个位置，不属于定义操作
    hasDeclared: boolean = false;
    readonly isModuleVar: boolean = false;//是否是模块变量，只有模块变量是可以导出的
    private readonly _moduleName: string;//所处模块名
    private readonly _funName?: string;//所处方法名，如果是模块变量，则该属性为空
    private readonly _scopeDepth?: number;//在方法体中所处的深度，如果是模块变量，则该属性为空
    private readonly _scopeID?: string;//因为相同深度的scope也会有多个，所以使用id来进行区分
    constructor(varDecNode: VarDefStmt, moduleName: string, funName?: string, scopeDepth?: number, scopeID?: string) {
        this._variableName =varDecNode.id.name;
        this._moduleName = moduleName;
        this._varDecNode = varDecNode;
        if (funName) {
            this._scopeDepth = scopeDepth;
            this._funName = funName;
            this._scopeID = scopeID;
        } else {
            this.isModuleVar = true;
        }
    }

    get varDecNode(): VarDefStmt {
        return this._varDecNode;
    }

    get variableName(): string {
        return this._variableName;
    }

    get moduleName(): string {
        return this._moduleName;
    }

    get funName(): string | null {
        if (this._funName)
            return this._funName;
        return null;
    }

    get scopeDepth(): number | null {
        if (this._scopeDepth)
            return this._scopeDepth;
        return null;
    }

    get scopeID(): string | null {
        if (this._scopeID)
            return this._scopeID;
        return null
    }
}