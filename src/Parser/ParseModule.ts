/*
 * Copyright (c) 2020. yaser. All rights reserved
 * Description: 模块解析
 */

import {getNextToken, getPreToken, initLexer, lookAheadToken} from "../Lexer/Lexer";
import {printErr, printFatalError, printInfo, printParseModuleError, printWarn} from "../Log";
import {ActionForm, GotoForm} from "./DataStruct/Form";
import {Stack} from "./DataStruct/Stack";
import {createVTByProduction, V_T_Wrap} from "./DataStruct/V_T_Wrap";
import {createSampleToken, Token} from "../Lexer/DataStruct/Token";
import {T} from "../Lexer/DataStruct/V_T";
import {EOF} from "./DataStruct/Production";
import {ActionFormItem, ActionStatus} from "./DataStruct/FormItem";
import {initBuildAST, pushBlock, pushFun, SCOPE_TYPE, transferVTToASTNode} from "./BuildAST";

let actionForm: ActionForm, gotoForm: GotoForm;
let symbolStack: Stack<V_T_Wrap> = new Stack();//符号栈
let statusStack: Stack<number> = new Stack();//状态栈
let curModulePath: string = "";//当前解析的模块

export function getCurParsingModuleInfo(): { moduleName, path } {
    const moduleName = curModulePath.substr(curModulePath.lastIndexOf("\\") + 1);
    return {moduleName: moduleName, path: curModulePath};
}

//解析单一模块
//使用LR分析器，根据已经生成的LR分析表，构建抽象语法树
export async function parseSingleModule(filePath: string, forms: object): Promise<boolean> {
    printInfo("解析模块...");
    curModulePath = filePath;
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
        return new V_T_Wrap(token.tokenType, token.lineNo, token);
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
            printWarn("发生冲突！" + actionItem);
        }
        switch (actionItem.action) {
            case ActionStatus.ACC:
                printInfo("语法树生成完毕！");
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
                let nowToken = nextToken;//移进处理后，此时的nextToken指代的是当前已经移进的Token
                // @ts-ignore
                statusStack.push(actionItem.shiftTo);
                if (nowToken.tokenType === T.LEFT_BRACE) {
                    //如果移进的是左大括号
                    //则表示需要一个block
                    pushBlock();
                } else if (nowToken.tokenType === T.FUN) {
                    //如果当前就是fun，那么下一个就是函数名
                    const funNameToken = lookAheadToken();//向后读取一个token
                    //根据前一个token的值来判断函数类型
                    const preToken = getPreToken();
                    if (preToken) {
                        let scopeType;
                        switch (preToken.tokenType) {
                            case T.STATIC: {
                                scopeType = SCOPE_TYPE.STATIC_FUN;
                                break;
                            }
                            case T.AT: {
                                scopeType = SCOPE_TYPE.INNER_FUN;
                                break;
                            }
                            default: {
                                scopeType = SCOPE_TYPE.GENERATE_FUN;
                                break;
                            }
                        }
                        pushFun(funNameToken.value, scopeType);
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
