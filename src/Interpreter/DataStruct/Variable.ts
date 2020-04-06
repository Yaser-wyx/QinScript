//变量包装类
import {BlockStmt, Exp, VariableDef} from "../../Parser/DataStruct/ASTNode";
import {printInterpreterError} from "../../Log";

export enum VARIABLE_TYPE {
    STRING,
    NUMBER,
    ARRAY,
    NULL,
    BOOLEAN,
    COMPLEXUS,//复合体变量，因为QS是面向过程的语言，不能有对象，所以此处的复合体类似于结构体，具体实现的话还是用js中的对象来实现
    REFERENCE//引用变量
}

export class IDWrap {
    private _idName: string;
    private _moduleName?: string;
    private _isStatic: boolean;
    private _isModule: boolean;
    private _referenceIndex: Array<string> = [];

    constructor(idName: string, isStatic: boolean, isModule: boolean, moduleName?: string) {
        this._idName = idName;
        this._moduleName = moduleName;
        this._isStatic = isStatic;
        this._isModule = isModule;
    }

    get idName(): string {
        return this._idName;
    }

    getModuleName(): string | null {
        if (this._moduleName) {
            return this._moduleName;
        }
        return null;
    }

    get isStatic(): boolean {
        return this._isStatic;
    }

    get isModule(): boolean {
        return this._isModule;
    }

    get referenceIndex(): Array<string> {
        return this._referenceIndex;
    }

    set referenceIndex(value: Array<string>) {
        this._referenceIndex = value;
    }
}

/*type referenceType =
    VARIABLE_TYPE.STRING
    | VARIABLE_TYPE.NUMBER
    | VARIABLE_TYPE.BOOLEAN
    | VARIABLE_TYPE.COMPLEXUS
    | VARIABLE_TYPE.NULL
    | VARIABLE_TYPE.ARRAY;*/
export function getValueType(value): VARIABLE_TYPE {
    //设置运算结果的数据类型，只处理非引用型数据类型
    let valueType;
    switch (typeof value) {
        case "boolean":
            valueType = VARIABLE_TYPE.BOOLEAN;
            break;
        case "number":
            valueType = VARIABLE_TYPE.NUMBER;
            break;
        case "string":
            valueType = VARIABLE_TYPE.STRING;
            break;
        case "object":
            if (Array.isArray(value)) {
                valueType = VARIABLE_TYPE.ARRAY;
            } else {
                valueType = VARIABLE_TYPE.COMPLEXUS;
            }
            break;
        default:
            valueType = VARIABLE_TYPE.NULL;
            break;
    }
    return valueType;
}

export class Reference {
    referencedVar: Variable;//被引用的变量
    referenceIndex: any;//只有在被引用变量是数组或复合体的时候，该项才有用，但不代表一定存在，反之如果存在，则一定是数组或复合体
    referencedType: VARIABLE_TYPE;//被引用对象的数据类型

    constructor(referencedVar: Variable, referencedType: VARIABLE_TYPE, referenceIndex?: number | string) {
        this.referencedVar = referencedVar;
        this.referenceIndex = referenceIndex;
        this.referencedType = referencedType;
    }

    setReferenceValue(varTypePair: VarTypePair) {
        //对所引用的变量值进行设置
        if (this.referenceIndex) {
            //如果存在index
            if (this.referencedType === VARIABLE_TYPE.ARRAY) {
                //如果是array，此时referenceIndex是一个数组形式
                let index = 0;
                let nowArray = this.referencedVar.getValue();
                for (; index < this.referenceIndex.length - 1; index++) {//注意-1，此处操作用于将对多维数组的操作转化为对一维数组的操作
                    nowArray = nowArray[this.referenceIndex[index]];//使用循环来读取多维数组中的数据，不断替换指向的数组，从最外层逐层向内读取
                    if (!nowArray) {
                        printInterpreterError("数组越界！");
                    }
                }
                nowArray[this.referenceIndex[index]] = varTypePair.value;//对一维数组设置值
            } else {
                //TODO 复合体
            }
        } else {
            //表示对当前变量重新赋值
            this.referencedVar.setValue(varTypePair);
        }
    }

    getReferenceValue(): any {
        //获取被引用的变量值
        let nowValue = this.referencedVar.getValue();
        if (this.referenceIndex) {
            //如果存在index
            if (this.referencedType === VARIABLE_TYPE.ARRAY) {
                //如果是array，此时referenceIndex是一个数组形式
                for (let i = 0; i < this.referenceIndex.length; i++) {
                    nowValue = nowValue[this.referenceIndex[i]];//使用循环来读取多维数组中的数据，不断替换指向的数组，从最外层逐层向内读取
                    if (!nowValue) {
                        printInterpreterError("数组越界！");
                    }
                }
            } else {
                //TODO 复合体
            }
        }
        return nowValue;
    }
}

export class VarTypePair {
    value: any;
    type: VARIABLE_TYPE;
    varName?: string;
    reference: Reference | null = null;

    constructor(type: VARIABLE_TYPE, valueOrReference: any, varName?: string) {
        this.type = type;
        this.varName = varName;
        if (type === VARIABLE_TYPE.REFERENCE) {
            this.reference = valueOrReference;
            this.value = (<Reference>valueOrReference).getReferenceValue();
        } else {
            this.value = valueOrReference;
        }
    }

    resetValue() {
        //重置值，因为在加入了对引用变量的索引后，当前的值已经过期了，需要重新检索值
        if (this.reference){
            this.value = this.reference.getReferenceValue();
        }
    }

    setValueToReference() {
        //将当前的value值赋值给自己所引用的变量
        if (this.reference) {
            this.reference.referencedVar.setValue(this, true)
        } else {
            printInterpreterError("引用的变量不存在！");
        }
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

    getValue(): any {
        return this._variableValue
    }

    get variableType(): VARIABLE_TYPE {
        return this._variableType;
    }

    setValue(varTypePair: VarTypePair, forceSet: boolean = false) {
        //forceSet表示是否将varTypePair中的值强制赋值给当前variable
        this._variableType = varTypePair.type;
        if (varTypePair.type === VARIABLE_TYPE.REFERENCE && !forceSet) {
            //如果是引用型数据，判断被引用的数据是不是基本型的，如果是基本型的就不进行引用
            if (varTypePair.reference) {
                let reference = varTypePair.reference;//获取引用
                /** 注：此处借用了部分JS的引用机制
                 *  因为如果value的类型不是基本数据类型的话，也就是对象的话，其实此处保存的是地址
                 *  但地址TS无法读取，也就无法实现，所以借用了JS对于对象的引用机制
                 */
                let value = reference.getReferenceValue();//获取引用的变量值
                this._variableType = getValueType(value);//获取引用的变量类型
                this._variableValue = value;
            }
        } else {
            this._variableValue = varTypePair.value;
        }
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