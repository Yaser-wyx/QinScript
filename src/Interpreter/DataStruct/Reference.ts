/*
 * Copyright (c) 2020. yaser. All rights reserved
 * Description: 变量引用
 */

import {printInterpreterError} from "../../Log";
import {Variable, VARIABLE_TYPE, VariableMeta} from "./Variable";

export class Reference {
    referencedVar: Variable;//被引用的变量
    referenceList: Array<any> = [];//只有在被引用变量是数组或复合体的时候，该项才有用，但不代表一定存在，反之如果存在，则一定是数组或复合体
    referencedType: VARIABLE_TYPE;//被引用对象的数据类型

    constructor(referencedVar: Variable, referencedType: VARIABLE_TYPE) {
        this.referencedVar = referencedVar;
        this.referencedType = referencedType;
    }

    setReferenceValue(varTypePair: VariableMeta) {
        //对所引用的变量值进行设置
        if (this.referenceList.length>0) {
            //如果存在index
            if (this.referencedType === VARIABLE_TYPE.ARRAY) {
                //如果是array，此时referenceIndex是一个数组形式
                let index = 0;
                let nowArray = this.referencedVar.getValue();
                for (; index < this.referenceList.length - 1; index++) {//注意-1，此处操作用于将对多维数组的操作转化为对一维数组的操作
                    nowArray = nowArray[this.referenceList[index]];//使用循环来读取多维数组中的数据，不断替换指向的数组，从最外层逐层向内读取
                    if (!nowArray) {
                        printInterpreterError("数组越界！");
                    }
                }
                nowArray[this.referenceList[index]] = varTypePair.value;//对一维数组设置值
            } else {
                //复合体变量
                this.referencedVar.getValue().setData(this.referenceList, varTypePair);
            }
        } else {
            //表示对当前变量重新赋值
            this.referencedVar.setValue(varTypePair);
        }
    }

    getReferenceValue(): any {
        //获取被引用的变量值
        let nowValue = this.referencedVar.getValue();
        if (this.referenceList.length > 0) {
            //如果存在index
            if (this.referencedType === VARIABLE_TYPE.ARRAY) {
                //如果是array，此时referenceIndex是一个数组形式
                for (let i = 0; i < this.referenceList.length; i++) {
                    nowValue = nowValue[this.referenceList[i]];//使用循环来读取多维数组中的数据，不断替换指向的数组，从最外层逐层向内读取
                    if (nowValue===undefined) {
                        printInterpreterError("数组越界！");
                    }
                }
            } else if (this.referencedType === VARIABLE_TYPE.STRING && this.referenceList.length === 1) {
                //字符串允许有一个下标
                nowValue = nowValue[this.referenceList[0]]
            } else if (this.referencedType === VARIABLE_TYPE.COMPLEXUS) {
                nowValue = nowValue.getRawData(this.referenceList);
            } else {
                //不能有数组下标
                return null;
            }
        }
        return nowValue;
    }
}