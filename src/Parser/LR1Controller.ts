//LR1 语法分析控制器
import {ActionForm, ActionFormItem, ActionStatus, GotoForm, GotoFormItem} from "./DataStruct/FormItem";
import {Stack} from "./DataStruct/Stack";
import {Production} from "./DataStruct/Production";
import {printFatalError} from "../error/error";
import {tree} from "../Utils/utils";

let actionForm: ActionForm, gotoForm: GotoForm;

export class SampleNode {
    readonly name: string;
    children: Array<SampleNode>;

    constructor(value: string, children: Array<SampleNode> = []) {
        this.name = value;
        this.children = children;
    }

    pushChild(child: SampleNode) {
        this.children.push(child);
    }
}


export function RunLr1(action: ActionForm, goto: GotoForm) {
    //开始分析，控制器入口
    actionForm = action;
    gotoForm = goto;
    let symbolStack: Stack<string> = new Stack();//符号栈
    let statusStack: Stack<number> = new Stack();//状态栈
    let nodeStack: Stack<SampleNode> = new Stack();//节点栈
    symbolStack.push("#");
    statusStack.push(0);
    let symbols = "abab#".split("");
    //先做个测试
    let flag = true;
    while (flag) {
        // @ts-ignore
        let actionItem: ActionFormItem = actionForm.getActionItem(statusStack.peek(), symbols[0]);
        switch (actionItem.action) {
            case ActionStatus.ACC:
                flag = false;
                break;
            case ActionStatus.ERROR:
                flag = false;
                console.log(actionItem.errMsg);
                break;
            case ActionStatus.REDUCE:
                let reduceProduction = <Production>actionItem.reduceBy;
                let popNum = reduceProduction.getProductionLength();
                symbolStack.popX(popNum);
                statusStack.popX(popNum);
                let nodeList: Array<SampleNode> = nodeStack.popX(popNum);
                let newSymbol = reduceProduction.key;//规约后的字符
                symbolStack.push(newSymbol);
                nodeStack.push(new SampleNode(newSymbol, nodeList));
                // @ts-ignore
                let gotoItem: GotoFormItem = gotoForm.getGotoItem(statusStack.peek(), newSymbol);
                statusStack.push(gotoItem.shiftTo);
                break;
            case ActionStatus.SHIFT:
                if (symbols.length > 0) {
                    let shift = symbols.shift();
                    // @ts-ignore
                    nodeStack.push(new SampleNode(shift));
                    // @ts-ignore
                    symbolStack.push(shift);
                    // @ts-ignore
                    statusStack.push(actionItem.shiftTo);
                }
                break;
            default:
                printFatalError("未知错误！");
                break;
        }
    }
    console.log(tree(nodeStack.pop()));
}