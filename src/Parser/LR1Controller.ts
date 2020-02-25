//LR1 语法分析控制器
import {ActionFormItem, ActionStatus} from "./DataStruct/FormItem";
import {Stack} from "./DataStruct/Stack";
import {printFatalError} from "../error/error";
import {getNextToken, lookAheadToken} from "../Lexer/Lexer";
import {ActionForm, GotoForm} from "./DataStruct/Form";
import {createSampleToken, Token} from "../Lexer/Datastruct/Token";
import {EOF, Production} from "./DataStruct/Production";
import {createVTByProduction, V_T_Wrap} from "./DataStruct/V_T_Wrap";
import {T} from "./DataStruct/V_T";
import {transferVTToASTNode} from "./BuildAST";

let actionForm: ActionForm, gotoForm: GotoForm;
let symbolStack: Stack<V_T_Wrap> = new Stack();//符号栈
let statusStack: Stack<number> = new Stack();//状态栈


export function Controller(action: ActionForm, goto: GotoForm) {
    let wrapToken = (token: Token) => {
        //将Token包装为V_T_Wrap
        return new V_T_Wrap(token.tokenType, token);
    };
    //开始分析，控制器入口
    actionForm = action;
    gotoForm = goto;
    let EOFToken = createSampleToken(T.EOF, EOF);
    symbolStack.push(wrapToken(EOFToken));
    statusStack.push(0);
    let flag = true;
    while (flag) {
        let nextToken = lookAheadToken();
        // @ts-ignore
        let actionItem: ActionFormItem = actionForm.getActionItem(statusStack.peek(), nextToken.getTokenTypeValue());
        if (actionItem.hasConflict) {
            //对于冲突项，特殊处理，现在只有一个冲突项
        } else {
            switch (actionItem.action) {
                case ActionStatus.ACC:
                    console.log("语法树生成完毕");
                    flag = false;
                    //ACC也需要进行最后一次reduce
                    //@ts-ignore
                    takeReduce(actionItem.reduceBy);
                    break;
                case ActionStatus.ERROR:
                    flag = false;
                    console.log(actionItem.errMsg);
                    break;
                case ActionStatus.REDUCE:
                    //规约处理
                    //@ts-ignore
                    takeReduce(actionItem.reduceBy);
                    break;
                case ActionStatus.SHIFT:
                    //移进处理
                    symbolStack.push(wrapToken(getNextToken()));
                    // @ts-ignore
                    statusStack.push(actionItem.shiftTo);
                    break;
                case ActionStatus.SHIFT_BY_E:
                    symbolStack.push(wrapToken(createSampleToken(T.NULL, "")));
                    // @ts-ignore
                    statusStack.push(actionItem.shiftTo);
                    break;
                default:
                    printFatalError("未知错误！");
                    break;
            }
        }
    }
}

function takeReduce(production: Production) {
    //规约：根据产生式的长度，将指定长度的符号个数与状态个数弹出栈
    if (production) {
        //防止为空
        let popLength = production.getProductionLength();//获取产生式长度
        statusStack.popX(popLength);//将状态弹出
        let V_TList: Array<V_T_Wrap> = symbolStack.popX(popLength);
        let vtWrap = createVTByProduction(production, V_TList);
        symbolStack.push(vtWrap);
        // @ts-ignore
        let gotoItem = gotoForm.getGotoItem(statusStack.peek(), vtWrap.getSymbolValue());
        statusStack.push(gotoItem.shiftTo);
        transferVTToASTNode(vtWrap);//构建状态树
    }
}
