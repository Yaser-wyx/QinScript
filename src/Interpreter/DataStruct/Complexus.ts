/*
 * Copyright (c) 2020. yaser. All rights reserved
 * Description: 复合体数据结构
 */


import {printInterpreterError, printWarn} from "../../Log";
import {Variable, VARIABLE_TYPE, VariableMeta} from "./Variable";
import {InnerFunDefStmt} from "../../Parser/DataStruct/ASTNode";
import _ = require("lodash");

export class Complexus {

    private readonly _moduleName: string;
    private readonly _staticFunName: string;
    private _data: object = {};//先使用JS原生的Object来代替
    constructor(moduleName: string, staticFunName: string) {
        this._moduleName = moduleName;
        this._staticFunName = staticFunName;
    }

    get data(): object {
        return this._data;
    }

    getInnerFunAndBotherData(funReferenceList: Array<string>): { brotherComplexus, innerFun } {
        //用于获取指定的内部函数，以及与该内部函数同级的所有静态变量与内部函数
        let dataReferenceList = _.clone(funReferenceList);
        dataReferenceList.pop();
        let innerFun = this.getRawData(funReferenceList);
        let newComplexus;
        if (innerFun instanceof InnerFunDefStmt) {
            newComplexus = new Complexus(this._moduleName, innerFun.staticFunName);//包装一个新的复合体给内部函数
            newComplexus._data = this.getRawData(dataReferenceList)//获取值，此处传递的是引用
        } else {
            printInterpreterError("无法找到指定内部函数" + funReferenceList.pop());
        }
        return {
            brotherComplexus: newComplexus,
            innerFun: innerFun
        }
    }

    getComplexusData(referenceList: Array<string>): Complexus {
        let newComplexus = new Complexus(this._moduleName, this._staticFunName);
        newComplexus._data = this.getRawData(referenceList);
        return newComplexus;
    }

    getRawData(referenceList: Array<string>) {
        let index = 0;
        let nowValue = this._data;
        for (; index < referenceList.length; index++) {
            nowValue = nowValue[referenceList[index]];
            if (nowValue === undefined) {
                //当前值不存在
                printInterpreterError("指定属性" + referenceList[index] + "不存在！");
            }
        }
        return nowValue;
    }

    setData(referenceList: Array<string>, varTypePair: VariableMeta) {
        let index = 0;
        let nowValue = this._data;
        for (; index < referenceList.length - 1; index++) {
            nowValue = nowValue[referenceList[index]];
            if (!nowValue) {
                printInterpreterError("要设置的属性名不存在！");
            }
        }
        nowValue[referenceList[index]] = varTypePair.value;//对一维数组设置值
    }

    setStaticVar(variable: Variable) {
        if (variable.variableType === VARIABLE_TYPE.COMPLEXUS) {
            this._data[variable.variableName] = variable.getValue().data;
        } else {
            this._data[variable.variableName] = variable.getValue();
        }
    }

    setInnerFun(innerFunDefStmt: InnerFunDefStmt) {
        this._data[innerFunDefStmt.getFunName()] = innerFunDefStmt;
    }
}

/*
//复合体缓存表
export class ComplexusCacheTable {
    //使用二级缓存
    private complexusNodeCacheTable: object = {};//第一级缓存用于检索节点
    private valueCacheTables: Array<object> = new Array<object>();//第二级缓存用于检索节点下的值

    addNewComplexusNode(idNameList: string) {
        const hashKey = hashCode(idNameList).toString();
        if (!this.complexusNodeCacheTable[hashKey]) {
            this.complexusNodeCacheTable[hashKey] = this.valueCacheTables.push({}) - 1;//value存放二级索引的index
        }
    }

    addNewValue(idNameList: string, valueIdName: string, valueNode: ComplexusValueNode) {
        const hashKey = hashCode(idNameList).toString();
        const index = this.complexusNodeCacheTable[hashKey];
        this.valueCacheTables[index][valueIdName] = valueNode;//此处存的是一个引用，而不是具体的值（吐槽：没有指针，真难用）
    }

    getValue(idNameList: string, valueIdName: string) {
        const hashKey = hashCode(idNameList).toString();
        const index = this.complexusNodeCacheTable[hashKey];
        return this.valueCacheTables[index][valueIdName].value;
    }

}

export class ComplexusValueTree {
    private root: ComplexusNode;//根节点
    private nodeStack: Stack<ComplexusNode> = new Stack<ComplexusNode>();//保存node的路径，且栈顶永远保存当前节点的父节点
    private curNode: ComplexusNode;//指向当前节点

    constructor(staticFunName: string) {
        this.root = new ComplexusNode(staticFunName, "", "root");
        this.curNode = this.root;
    }

    //给当前节点添加值节点，该值就是基础数据类型的值，可以是字符串，数字，布尔或数组等形式
    addValueNode(idName: string, value: any) {
        this.curNode.valueArray.push(new ComplexusValueNode(idName, value));
    }

    //给当前节点扩展一层新的Complexus节点，也就是扩展树的高度，并进入到该节点中
    extendComplexus(idName: string, staticFunName: string) {
        let newNode = new ComplexusNode(staticFunName, this.curNode.getIdNameList(), idName);//扩展一层新的节点
        this.curNode.valueArray.push(newNode);//将新生成的节点加入到当前节点的值列表中
        this.nodeStack.push(this.curNode);//保存当前节点
        this.curNode = newNode;//修改当前节点为新生成的节点
    }

    //返回到上一层的Complexus节点
    backPreNode() {
        if (!this.nodeStack.isEmpty()) {
            this.curNode = this.nodeStack.pop();
        }
    }
}

type node = ComplexusNode | ComplexusValueNode;

class ComplexusNode {
    private _preIdNames: string;
    private _idName: string;//id名
    private _valueArray: Array<node>;
    private _staticFunName: string;//所处的静态函数名

    constructor(staticFunName: string, preIdNames: string, idName: string,) {
        this._idName = idName;
        this._preIdNames = preIdNames;
        this._valueArray = new Array<any>();
        this._staticFunName = staticFunName;
    }

    addValueNode(idName: string, value?: any) {
        this._valueArray.push(new ComplexusValueNode(idName, value));
    }

    get valueArray(): Array<node> {
        return this._valueArray;
    }

    get idName(): string {
        return this._idName;
    }

    get staticFunName(): string {
        return this._staticFunName;
    }

    getIdNameList(): string {
        return this._preIdNames + ";" + this._idName;
    }
}

class ComplexusValueNode {
    private _idName: string;
    private _value: any = null;

    constructor(idName: string, value?: any) {
        this._idName = idName;
        this._value = value;
    }

    get value(): any {
        return this._value;
    }

    set value(value: any) {
        this._value = value;
    }

    get idName(): string {
        return this._idName;
    }
}*/
