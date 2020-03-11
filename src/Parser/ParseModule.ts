import {getNextToken, initLexer, lookAheadToken, lookAheadXToken} from "../Lexer/Lexer";
import {printParseModuleError, printErr, printFatalError, printInfo, printWarn} from "../error/error";
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
    printInfo("解析模块...");
    let initSuccess = await initLexer(filePath);//初始化词法分析器
    if (initSuccess) {//是否初始化成功
        printInfo("词法分析成功，开始执行语法分析...");
        if (forms) {
            // @ts-ignore
            return BuildAST(forms.actionForm, forms.gotoForm);
        }
    }
    printErr("词法分析失败！");
    return false;
}


//LR1 语法分析控制器，用于控制语法树的生成，一个模块即为一棵语法树，返回是否构建成功
export function BuildAST(action: ActionForm, goto: GotoForm): boolean {
    let wrapToken = (token: Token) => {
        //将Token包装为V_T_Wrap
        return new V_T_Wrap(token.tokenType, token);
    };
    printInfo("构建语法树...");
    //开始分析，控制器入口
    initBuildAST();//初始化语法树构造器
    actionForm = action;
    gotoForm = goto;
    let EOFToken = createSampleToken(T.EOF, EOF);//构造EOF
    symbolStack.push(wrapToken(EOFToken));
    statusStack.push(0);
    let flag = true;//AST是否构造完毕，用于控制循环
    let success = true;//AST是否生成成功。
    printInfo("开始构造语法树!");
    while (flag && success) {
        let nextToken = lookAheadToken();//向前读取一个token
        // @ts-ignore
        //根据栈顶状态，以及预读取的token，来获取下一个转移的状态
        let actionItem: ActionFormItem = actionForm.getActionItem(statusStack.peek(), nextToken.getTokenTypeValue());
        if (actionItem.hasConflict) {
            printWarn("发生冲突！"+actionItem);
        }
        switch (actionItem.action) {
            case ActionStatus.ACC:
                printInfo("语法树生成成功完毕！");
                flag = false;
                break;
            case ActionStatus.ERROR:
                //生成失败
                success = false;
                printParseModuleError(nextToken, actionItem.errMsg);
                break;
            case ActionStatus.REDUCE:
                //规约：根据产生式的长度，将指定长度的符号个数与状态个数弹出栈
                let production = actionItem.reduceBy;
                if (production) {
                    //防止为空
                    let popLength = production.getProductionLength();//获取产生式长度
                    statusStack.popX(popLength);//将状态弹出
                    let V_TList: Array<V_T_Wrap> = symbolStack.popX(popLength);
                    let vtWrap = createVTByProduction(production, V_TList);
                    symbolStack.push(vtWrap);
                    // @ts-ignore
                    let gotoItem = gotoForm.getGotoItem(statusStack.peek(), vtWrap.getSymbolValue());
                    if (gotoItem.shiftTo !== -1) {
                        statusStack.push(gotoItem.shiftTo);
                        transferVTToASTNode(vtWrap);//构建状态树
                    } else {
                        success = false;
                        printParseModuleError(nextToken, gotoItem.errMsg);
                    }
                } else {
                    success = false;
                    printParseModuleError(nextToken, "运行时错误，规约失败，产生式缺失！");
                }
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
                printFatalError("构建语法树时，发生未知错误！");
                break;
        }
    }
    return success;
}
