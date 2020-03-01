import {getNextToken, initLexer, lookAheadToken, lookAheadXToken} from "../Lexer/Lexer";
import {printFatalError} from "../error/error";
import {ActionForm, GotoForm} from "./DataStruct/Form";
import {Stack} from "./DataStruct/Stack";
import {createVTByProduction, V_T_Wrap} from "./DataStruct/V_T_Wrap";
import {createSampleToken, Token} from "../Lexer/Datastruct/Token";
import {T} from "./DataStruct/V_T";
import {EOF, Production} from "./DataStruct/Production";
import {ActionFormItem, ActionStatus} from "./DataStruct/FormItem";
import {initBuildAST, pushBlock, pushFun, transferVTToASTNode} from "./BuildAST";
import {FUN_TYPE} from "../Interpreter/Fun";

let actionForm: ActionForm, gotoForm: GotoForm;
let symbolStack: Stack<V_T_Wrap> = new Stack();//符号栈
let statusStack: Stack<number> = new Stack();//状态栈

//解析模块
//使用LR分析器，根据已经生成的LR分析表，构建抽象语法树
export async function parseModule(filePath: string, forms: object): Promise<boolean> {
    let initSuccess = await initLexer(filePath);//初始化词法分析器
    if (initSuccess) {//是否初始化成功
        if (forms) {
            // @ts-ignore
            return BuildASTController(forms.actionForm, forms.gotoForm);
        }
    }
    return false;
}


//LR1 语法分析控制器，用于控制语法树的生成，一个模块即为一棵语法树，返回是否构建成功
export function BuildASTController(action: ActionForm, goto: GotoForm): boolean {
    let wrapToken = (token: Token) => {
        //将Token包装为V_T_Wrap
        return new V_T_Wrap(token.tokenType, token);
    };
    //开始分析，控制器入口
    initBuildAST();//初始化语法树构造器
    actionForm = action;
    gotoForm = goto;
    let EOFToken = createSampleToken(T.EOF, EOF);
    symbolStack.push(wrapToken(EOFToken));
    statusStack.push(0);
    let flag = true;
    let success = false;
    while (flag) {
        let nextToken = lookAheadToken();
        // @ts-ignore
        //获取下一个转移的状态
        let actionItem: ActionFormItem = actionForm.getActionItem(statusStack.peek(), nextToken.getTokenTypeValue());
        if (actionItem.hasConflict) {
            //对于冲突项，特殊处理，现在只有一个冲突项
        } else {
            switch (actionItem.action) {
                case ActionStatus.ACC:
                    console.log("语法树生成完毕");
                    flag = false;
                    success = true;
                    break;
                case ActionStatus.ERROR:
                    //生成失败
                    flag = false;
                    success = false;
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
                    //移进后处理，注意此时的nextToken指代的是当前已经移进的Token
                    if (nextToken.tokenType === T.LEFT_BRACE) {
                        //如果移进的是左大括号
                        //则表示需要一个block
                        pushBlock();
                    } else {
                        let tempNextToken = lookAheadToken();
                        if (tempNextToken.tokenType === T.FUN || nextToken.tokenType === T.FUN) {
                            if (nextToken.tokenType === T.STATIC && tempNextToken.tokenType === T.FUN) {
                                let funName = lookAheadXToken(2);
                                pushFun(funName.value, FUN_TYPE.STATIC);
                            } else if (nextToken.tokenType === T.AT && tempNextToken.tokenType === T.FUN) {
                                let funName = lookAheadXToken(2);
                                pushFun(funName.value, FUN_TYPE.INNER);
                            } else if (nextToken.tokenType === T.FUN && tempNextToken.tokenType === T.ID) {
                                pushFun(tempNextToken.value, FUN_TYPE.GENERAL);
                            }
                        }
                    }
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
    return success;
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

