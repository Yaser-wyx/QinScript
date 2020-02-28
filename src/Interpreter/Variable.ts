//变量包装类
import {VarDefStmt} from "../Parser/DataStruct/ASTNode";

export enum VARIABLE_TYPE {
    STRING,
    NUMBER,
    ARRAY,
    OBJECT,
    NULL
}

export class Variable {
    private readonly _variableName: string;//变量名
    variableValue: any = undefined;//变量值在执行的时候赋值
    private variableType: VARIABLE_TYPE = VARIABLE_TYPE.NULL;//变量类型，默认为null
    private readonly _varDecNode: VarDefStmt;//变量定义节点
    //是否定义了，因为所有变量会在生成语法树的时候加入到符号表中，此时只是占个位置，不属于定义操作
    hasDeclared: boolean = false;
    readonly isModuleVar: boolean = false;//是否是模块变量，只有模块变量是可以导出的
    private readonly _moduleName: string;//所处模块名
    private readonly _funName?: string;//所处方法名，如果是模块变量，则该属性为空
    private readonly _blockDepth?: number;//在方法体中所处的深度，如果是模块变量，则该属性为空
    private readonly _blockID?: string;//因为相同深度的scope也会有多个，所以使用id来进行区分
    constructor(varDecNode: VarDefStmt, moduleName: string, funName?: string, blockDepth?: number, blockID?: string) {
        this._variableName = varDecNode.id.name;
        this._moduleName = moduleName;
        this._varDecNode = varDecNode;
        if (funName) {
            this._blockDepth = blockDepth;
            this._funName = funName;
            this._blockID = blockID;
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

    get blockDepth(): number | null {
        if (this._blockDepth)
            return this._blockDepth;
        return null;
    }

    get blockID(): string | null {
        if (this._blockID)
            return this._blockID;
        return null
    }
}