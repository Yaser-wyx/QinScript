import {Production} from "./Production";
import {hashCode} from "../../Utils/utils";

//TODO 如果有时间可以构造两个接口，一个是formItem，另一个是Form，以便实现面向接口编程
export class GotoFormItem {
    //LR分析表中Goto子表的项目
    expected: string;
    stateIndex: number = 0;//状态索引
    shiftTo: number;
    errMsg: string = "";
    private hashCode: number = 0;

    constructor(expected: string, shiftTo: number, stateIndex: number) {
        this.expected = expected;
        this.stateIndex = stateIndex;
        this.shiftTo = shiftTo;
        this.hashCode = hashCode(this.getInfo());
    }

    getHash() {
        return this.hashCode;
    }

    isSame(item: GotoFormItem) {
        return item.getHash() === this.hashCode;
    }

    getInfo() {
        return "     expected: " + this.expected + "    value: " + this.shiftTo + "\n";
    }
}

export enum ActionStatus {
    //操作
    ACC,
    SHIFT,
    REDUCE,
    ERROR,
    SHIFT_BY_E,//使用空字符转移
}

export class ActionFormItem {
    //LR分析表中Action子表的项目
    shiftTo?: number;//要转移到的状态
    private _action: ActionStatus = ActionStatus.ERROR;
    expected: string;//期望的字符
    reduceBy?: Production;//使用哪个产生式进行reduce
    errMsg: string = "";
    stateIndex?: number = 0;
    hasConflict: boolean = false;
    conflictArray: Array<ActionFormItem> = new Array<ActionFormItem>();
    private hashCode: number = 0;

    get action(): ActionStatus {
        return this._action;
    }

    isSame(item: ActionFormItem) {
        if (this.hasConflict) {
            for (let conflictItem of this.conflictArray) {
                if (conflictItem.getHash() === item.getHash()) {
                    return true;
                }
            }
        }
        return item.getHash() === this.getHash();
    }

    constructor(expected: string, action: ActionStatus, stateIndex?: number, shiftToOrReduceBy?: number | Production) {
        this.expected = expected;
        this.stateIndex = stateIndex;
        this.setOperationByAction(action, shiftToOrReduceBy);
    }


    setOperationByAction(action: ActionStatus, shiftToOrReduceBy?: number | Production) {
        this._action = action;
        if (shiftToOrReduceBy) {
            switch (action) {
                case ActionStatus.REDUCE:
                    this.reduceBy = <Production>shiftToOrReduceBy;
                    break;
                case ActionStatus.SHIFT :
                    this.shiftTo = <number>shiftToOrReduceBy;
                    break;
                case ActionStatus.SHIFT_BY_E:
                    this.shiftTo = <number>shiftToOrReduceBy;
                    break;
                case ActionStatus.ACC:
                    this.reduceBy = <Production>shiftToOrReduceBy;
                    break;
            }
        }
    }

    getHash() {
        return hashCode(this.getInfo());
    }

    getInfo() {
        let info = "";
        info += "     expected: " + this.expected;
        if (this.action === ActionStatus.REDUCE) {
            info += "    reduceBy: " + (<Production>this.reduceBy).getValue(false) + "\n"
        } else if (this.action === ActionStatus.ACC) {
            info += "    ACC"
        } else {
            info += "    shiftTo: " + this.shiftTo + "\n";
        }
        return info;
    }
}



