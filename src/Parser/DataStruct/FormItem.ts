import {Production} from "./Production";
import {printBuildFormError} from "../../error/error";

//TODO 如果有时间可以构造两个接口，一个是formItem，另一个是Form，以便实现面向接口编程
export class GotoFormItem {
    //LR分析表中Goto子表的项目
    expected: string;
    stateIndex: number = 0;//状态索引
    shiftTo: number;
    errMsg: string = "";

    constructor(expected: string, shiftTo: number, stateIndex: number) {
        this.expected = expected;
        this.stateIndex = stateIndex;
        this.shiftTo = shiftTo;
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

    get action(): ActionStatus {
        return this._action;
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
            sendFormErrorMsg(this.items[stateIndex][expected], new GotoFormItem(expected, shiftTo, stateIndex));
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
        console.log("--------------------GotoForm--------------------");
        this.items.forEach((item, index) => {
            let str = "状态：" + index + "\n";
            for (let itemKey in item) {
                str += item[itemKey].getInfo();
            }
            console.log(str);
        })
    }
}

type formItem = ActionFormItem | GotoFormItem;

function sendFormErrorMsg(oldItem: formItem, newItem: formItem) {
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
    printBuildFormError(errorMsg)
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
            sendFormErrorMsg(this.items[stateIndex][expected], new ActionFormItem(expected, action, stateIndex, shiftToOrReduceBy));
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
        console.log("--------------------ActionForm--------------------");
        this.items.forEach((item, index) => {
            let str = "状态：" + index + "\n";
            for (let itemKey in item) {
                str += item[itemKey].getInfo();
            }
            console.log(str);
        })
    }
}
