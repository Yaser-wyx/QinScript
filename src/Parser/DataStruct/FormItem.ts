import {Production} from "./Production";
import {addBuildFormError} from "../../error/error";
import {hashCode, writeToFile} from "../../Utils/utils";

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
    ERROR
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
        return item.getHash() === this.hashCode;
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
                case ActionStatus.SHIFT:
                    this.shiftTo = <number>shiftToOrReduceBy;
                    break;
            }
        }
        this.hashCode = hashCode(this.getInfo());
    }

    getHash() {
        return this.hashCode;
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


export class GotoForm {
    private items: Array<object>;//数组下标表示状态码
    private errorItem: GotoFormItem;

    constructor(statusNum: number) {
        this.items = new Array<object>(statusNum);
        this.errorItem = new GotoFormItem("", -1, -1);
    }

    setGotoItem(stateIndex: number, expected: string, shiftTo: number) {
        if (!this.items[stateIndex]) {
            this.items[stateIndex] = {};
        }
        if (!this.items[stateIndex][expected]) {
            this.items[stateIndex][expected] = new GotoFormItem(expected, shiftTo, stateIndex)
        } else {
            //发生冲突
            let newItem = new GotoFormItem(expected, shiftTo, stateIndex);
            if (!newItem.isSame(this.items[stateIndex][expected])) {
                sendFormWarnMsg(this.items[stateIndex][expected], newItem);
            }
        }

    }

    getGotoItem(stateIndex: number, expected: string) {
        let item = this.items[stateIndex][expected];
        if (item) {
            //如果存在
            return item;
        } else {
            this.errorItem.errMsg = "当前状态：" + stateIndex + " 无法匹配" + expected + ";";
            return this.errorItem;
        }
    }

    print() {
        //打印Goto表
        let str = "--------------------GotoForm--------------------\n";
        this.items.forEach((item, index) => {
            str += "------------------------------------------------\n";

            str += "状态：" + index + "\n";
            for (let itemKey in item) {
                str += item[itemKey].getInfo() + "\n";
            }
            str += "------------------------------------------------\n";

        });
        writeToFile(str, "Goto.table.txt");
    }
}

type formItem = ActionFormItem | GotoFormItem;

function sendFormWarnMsg(oldItem: formItem, newItem: formItem) {
    let errorMsg = "";
    if (oldItem instanceof ActionFormItem) {
        errorMsg = "    Action表发生移进规约冲突；\n";
    } else {
        errorMsg = "    Goto表发生移进规约冲突；\n";
    }
    errorMsg += "    在状态：" + oldItem.stateIndex + "    展望字符：" + oldItem.expected + " 上已有项目\n";
    errorMsg += "    旧项目内容：\n";
    errorMsg += oldItem.getInfo();
    errorMsg += "    新项目内容：\n";
    errorMsg += newItem.getInfo();
    addBuildFormError(errorMsg)
}

export class ActionForm {
    private items: Array<object>;//数组下标表示状态码
    private errorItem: ActionFormItem;

    constructor(statusNum: number) {
        this.items = new Array<object>(statusNum);
        this.errorItem = new ActionFormItem("", ActionStatus.ERROR);
    }

    setActionItem(stateIndex: number, action: ActionStatus, expected: string, shiftToOrReduceBy?: number | Production) {
        if (!this.items[stateIndex]) {
            this.items[stateIndex] = {};
        }
        if (!this.items[stateIndex][expected]) {
            this.items[stateIndex][expected] = new ActionFormItem(expected, action, stateIndex, shiftToOrReduceBy)
        } else {
            //发生冲突
            let conflictItem = new ActionFormItem(expected, action, stateIndex, shiftToOrReduceBy);
            if (!conflictItem.isSame(this.items[stateIndex][expected])) {
                this.items[stateIndex][expected].hasConflict = true;
                this.items[stateIndex][expected].conflictArray.push(conflictItem);
                sendFormWarnMsg(this.items[stateIndex][expected], conflictItem);//发出提示
            }
        }
    }

    getActionItem(stateIndex: number, expected: string) {
        let item = this.items[stateIndex][expected];
        if (item) {
            //如果存在
            return item;
        } else {
            this.errorItem.errMsg = "当前状态：" + stateIndex + " 无法匹配" + expected + ";";
            return this.errorItem;
        }

    }

    print() {
        //打印Action表
        let str = "--------------------ActionForm--------------------\n";
        this.items.forEach((item, index) => {
            str += "------------------------------------------------\n";
            str += "状态：" + index + "\n";
            for (let itemKey in item) {
                str += item[itemKey].getInfo() + "\n";
                if (item[itemKey].hasConflict) {
                    str+= "------------------------------冲突项-------------------\n";
                    item[itemKey].conflictArray.forEach((conflictItem: ActionFormItem) => {
                        str += conflictItem.getInfo() + "\n";
                    })
                    str+="-------------------------------------------------------\n"
                }
            }
            str += "------------------------------------------------\n";
        });
        writeToFile(str, "Action.table.txt");
    }
}
