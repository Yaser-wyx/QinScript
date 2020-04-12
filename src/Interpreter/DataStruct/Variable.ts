//变量包装类
import {BlockStmt, Exp, VariableDef} from "../../Parser/DataStruct/ASTNode";
import {printInterpreterError} from "../../Log";
import {Reference} from "./Reference";
import {Complexus} from "./Complexus";

export enum VARIABLE_TYPE {
    STRING,
    NUMBER,
    ARRAY,
    NULL,
    BOOLEAN,
    COMPLEXUS,//复合体变量，因为QS是面向过程的语言，不能有对象，所以此处的复合体类似于结构体，具体实现的话还是用js中的对象来实现
    REFERENCE//引用变量，注：不属于可以直接使用的变量类型
}

//ID可能是单独的一个标识符，也可能是其它模块的标识符，也可能是复合体
export class IDWrap {
    private readonly _idName: string;//ID名
    private readonly _moduleName: string;//ID所处模块名
    private readonly _hasAt: boolean;//是否有AT前缀，如果有则表示可能访问当前静态函数的静态变量，或调用当前静态函数的其它内部函数
    private _referenceList: Array<string> = [];//id引用链

    constructor(idName: string, moduleName: string, hasAt: boolean=false) {
        this._idName = idName;
        this._moduleName = moduleName;
        this._hasAt = hasAt;
    }

    get idName(): string {
        return this._idName;
    }


    get moduleName(): string {
        return this._moduleName;
    }

    get hasAt(): boolean {
        return this._hasAt;
    }

    get referenceList(): Array<string> {
        return this._referenceList;
    }

    set referenceList(value: Array<string>) {
        this._referenceList = value;
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



export class VariableMeta {
    //用于描述变量的数据
    private _value: any;
    type: VARIABLE_TYPE;
    varName?: string;
    reference: Reference | null = null;

    constructor(type: VARIABLE_TYPE, valueOrReference: any, varName?: string) {
        this.type = type;
        this.varName = varName;
        if (type === VARIABLE_TYPE.REFERENCE) {
            this.reference = valueOrReference;
            this._value = (<Reference>valueOrReference).getReferenceValue();
        } else {
            this._value = valueOrReference;
        }
    }

    get value(): any {
        return this._value;
    }

    set value(value: any) {
        this._value = value;
    }

    resetValue() {
        //重置值，因为在加入了对引用变量的索引后，当前的值已经过期了，需要重新检索值
        if (this.reference) {
            this._value = this.reference.getReferenceValue();
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
    private _hasDeclared: boolean = false;//是否定义了，对于模块变量，可能出现定义了，但没有初始化的情况
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

    initLocalVar(varTypePair: VariableMeta, block: BlockStmt, isStatic: boolean = false) {
        this.setValue(varTypePair);
        this._blockDepth = block.blockDepth;
        this._blockID = block.blockID;
        this.isStatic = isStatic;
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

    setValue(varTypePair: VariableMeta, forceSet: boolean = false) {
        //forceSet表示是否将varTypePair中的值强制赋值给当前variable
        this._variableType = varTypePair.type;
        this._hasDeclared = true;//已定义
        if (varTypePair.varName){
            this._variableName = varTypePair.varName;
        }
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
            if (this._variableValue instanceof Complexus){
                //@ts-ignore
                this._variableValue.setData(varTypePair.reference.referenceList,varTypePair)
            }else{
                this._variableValue = varTypePair.value;
            }
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