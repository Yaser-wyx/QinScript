import {writeToFile} from "../../Utils/utils";
import {addBuildFormError, printBuildFormError, printFatalError, printWarn} from "../../Log";
import {E, Production} from "./Production";
import {ActionFormItem, ActionStatus, GotoFormItem} from "./FormItem";
import {ACTION_TABLE_FILE, GOTO_TABLE_FILE} from "../../Cli/config";

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

    static buildGotoFromCache(cache: GotoForm) {
        let newGoto: GotoForm = new GotoForm(cache.items.length);
        try {
            cache.items.forEach((item: object) => {
                for (let itemKey in item) {
                    let gotoItem: GotoFormItem = item[itemKey];
                    newGoto.setGotoItem(gotoItem.stateIndex, gotoItem.expected, gotoItem.shiftTo);
                }
            });
            return newGoto;
        } catch (e) {
            printWarn("Goto表缓存文件转换出现失败！");
            return false;
        }


    }

    getGotoItem(stateIndex: number, expected: string): GotoFormItem {
        let item = this.items[stateIndex][expected];
        if (item) {
            //如果存在
            return item;
        } else {
            this.errorItem.errMsg = "Goto表读取错误，当前状态：" + stateIndex + " 无法匹配" + expected + ";";
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
        writeToFile(str, GOTO_TABLE_FILE);
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

    static buildActionFromCache(cache: ActionForm) {
        try {
            let newAction: ActionForm | boolean = new ActionForm(cache.items.length);
            let getProduction = (actionItem) => {
                let production = new Production(actionItem.reduceBy.key);
                production.copy(actionItem.reduceBy);
                return production;
            };
            cache.items.forEach((item: object) => {
                for (let itemKey in item) {
                    let actionItem = item[itemKey];
                    switch (actionItem._action) {
                        case ActionStatus.SHIFT_BY_E:
                            //@ts-ignore
                            newAction.setActionItem(actionItem.stateIndex, ActionStatus.SHIFT_BY_E, actionItem.expected, actionItem.shiftTo);
                            break;
                        case ActionStatus.SHIFT:
                            //@ts-ignore
                            newAction.setActionItem(actionItem.stateIndex, ActionStatus.SHIFT, actionItem.expected, actionItem.shiftTo);
                            break;
                        case ActionStatus.REDUCE:
                            //@ts-ignore
                            newAction.setActionItem(actionItem.stateIndex, ActionStatus.REDUCE, actionItem.expected, getProduction(actionItem));
                            break;
                        case ActionStatus.ACC:
                            //@ts-ignore
                            newAction.setActionItem(actionItem.stateIndex, ActionStatus.ACC, actionItem.expected, getProduction(actionItem));
                            break;
                    }
                }
            });
            return newAction;
        } catch (e) {
            printWarn("Action缓存文件转换出现失败！");
            return false;
        }

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
            let item = this.items[stateIndex][expected];
            if (!item.isSame(conflictItem)) {
                //如果发生了冲突，且与之前的不是同一个，则将新的冲突项加入
                item.hasConflict = true;
                item.conflictArray.push(conflictItem);
                sendFormWarnMsg(item, conflictItem);//发出冲突项提示
            }
        }
    }

    getActionItem(stateIndex: number, expected: string) {
        let item = this.items[stateIndex][expected];
        if (item) {
            //如果存在
            return item;
        } else {
            //如果不存在可以识别的状态，则查看该状态是否有空字符，如果有，则返回该空字符的转移操作
            item = this.items[stateIndex][E];
            if (item) {
                return item;
            }
            //失败信息
            this.errorItem.errMsg = "Action表读取失败，当前状态：" + stateIndex + " 无法匹配：" + expected;
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
                    str += "------------------------------冲突项-------------------\n";
                    item[itemKey].conflictArray.forEach((conflictItem: ActionFormItem) => {
                        str += conflictItem.getInfo() + "\n";
                    });
                    str += "-------------------------------------------------------\n"
                }
            }
            str += "------------------------------------------------\n";
        });
        writeToFile(str, ACTION_TABLE_FILE);
    }
}