//变量包装类
import {BlockStmt, Exp, VarDefStmt, VariableDef, VariableExp} from "../Parser/DataStruct/ASTNode";

export enum VARIABLE_TYPE {
    STRING,
    NUMBER,
    ARRAY,
    NULL,
    BOOLEAN,
    COMPLEXUS
}

export class VarTypePair {
    value: any;
    type: VARIABLE_TYPE;
    varName?: string;

    constructor(value: any, type: VARIABLE_TYPE, varName?: string) {
        this.value = value;
        this.type = type;
        this.varName = varName;
    }

    copyValue(varTypePair: VarTypePair) {
        this.value = varTypePair.value;
        this.type = varTypePair.type;
    }
}

export class Variable {
    private _variableName: string = "";//变量名
    private _variableValue: any = null;//变量值在执行的时候赋值
    private _variableType: VARIABLE_TYPE = VARIABLE_TYPE.NULL;//变量类型，默认为null
    private readonly _varInitExp: Exp | null = null;//变量初始化表达式
    //是否定义了，因为所有变量会在生成语法树的时候加入到符号表中，此时只是占个位置，不属于定义操作
    private _hasDeclared: boolean = false;
    private isStatic: boolean = false;//是否为静态变量
    private isModuleVar: boolean = false;//是否是模块变量，只有模块变量是可以导出的
    private readonly _moduleName: string;//所处模块名
    private _blockDepth?: number;//在方法体中所处的深度，如果是模块变量，则该属性为空
    private _blockID?: string;//因为相同深度的scope也会有多个，所以使用id来进行区分

    constructor(moduleName: string, variableDef?: VariableDef) {
        this._moduleName = moduleName;
        if (variableDef) {
            //只有构造模块变量时才使用该方式
            let varDefStmt = variableDef.VarDefStmt;
            this._variableName = varDefStmt.id;
            this.isModuleVar = true;
            if (varDefStmt.init) {
                //设置初始值
                this._varInitExp = varDefStmt.init;
            }
        }
    }

    initLocalVar(varTypePair: VarTypePair, block: BlockStmt, isStatic: boolean = false) {
        this.setValue(varTypePair);
        this._blockDepth = block.blockDepth;
        this._blockID = block.blockID;
        this.isStatic = isStatic;
        this._hasDeclared = true;//已定义
        if (varTypePair.varName) {
            this._variableName = varTypePair.varName;
        }
    }

    initModuleVar() {
        this._hasDeclared = true;//已定义
        return this._varInitExp;//返回用于构建模块变量值的表达式
    }

    get hasDeclared(): boolean {
        return this._hasDeclared;
    }

    get variableValue(): any {
        return this._variableValue;
    }

    get variableType(): VARIABLE_TYPE {
        return this._variableType;
    }

    setValue(Pair: VarTypePair) {
        this._variableValue = Pair.value;
        this._variableType = Pair.type;
    }

    get variableName(): string {
        return this._variableName;
    }

    get moduleName(): string {
        return this._moduleName;
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