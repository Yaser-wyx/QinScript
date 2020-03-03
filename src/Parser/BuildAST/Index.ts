import {Stack} from "../DataStruct/Stack";
import {
    ArgumentList,
    ArraySub,
    AssignStmt,
    BinaryExp,
    BlockStmt,
    CallExp,
    Exp,
    Expression,
    FunDeclaration,
    Literal,
    Node,
    NODE_TYPE,
    OPERATOR,
    Operator,
    OPERATOR_TYPE,
    ParamList,
    ReturnStmt,
    Statement,
    UnaryExp,
    VarDefStmt,
    VariableExp,
    WhileStmt
} from "../DataStruct/ASTNode";
import {V_T_Wrap} from "../DataStruct/V_T_Wrap";
import {T, V} from "../DataStruct/V_T";
import {
    ARRAY_SUB,
    COMMA,
    EXP,
    FALSE,
    ID,
    MAIN,
    NULL,
    NUMBER,
    OPERATOR_LIST,
    STATIC,
    STRING,
    TRUE,
    UNARY_BEFORE_OPERATOR,
    UNARY_AFTER_OPERATOR,
} from "../DataStruct/TConstant";
import {QSModule} from "../../Interpreter/Module";
import {Token} from "../../Lexer/Datastruct/Token";
import {Fun, FUN_TYPE} from "../../Interpreter/Fun";
import {getSymbolTable, SymbolTable} from "../../Interpreter/SymbolTable";
import {Variable} from "../../Interpreter/Variable";
import {createUniqueId, kill} from "../../Utils/utils";
import {getInterpreterInfo, InterpreterInfo} from "../../Interpreter/InterpreterInfo";

let ASTStack: Stack<Node>;
let blockStack: Stack<BlockStmt>;
let funStack: Stack<Fun>;
let hasImport = false;
let qsModule: QSModule;
let symbolTable: SymbolTable;
let curScopeState: SCOPE_STATE;
let curBlockDepth: number = 0;//当前所处scope的深度
let curBlockID: string = "";//当前所处scope的ID
let curFun: Fun | null;//当前的函数
let interpreterInfo: InterpreterInfo;

//构建AST时目前所处的作用域
enum SCOPE_STATE {
    MODULE,//模块作用域
    GENERAL_FUN,//普通函数作用域
    STATIC_FUN,//静态函数作用域
    INNER_FUN//内部函数作用域
}


export function pushFun(funName: string, funType: FUN_TYPE) {
    let newFun: Fun | null = null;
    switch (funType) {
        case FUN_TYPE.GENERAL:
            curScopeState = SCOPE_STATE.GENERAL_FUN;
            newFun = new Fun(qsModule.moduleName, funName, FUN_TYPE.GENERAL);
            break;
        case FUN_TYPE.INNER:
            curScopeState = SCOPE_STATE.INNER_FUN;
            newFun = new Fun(qsModule.moduleName, funName, FUN_TYPE.INNER);
            break;
        case FUN_TYPE.STATIC:
            curScopeState = SCOPE_STATE.STATIC_FUN;
            newFun = new Fun(qsModule.moduleName, funName, FUN_TYPE.STATIC);
    }
    if (newFun) {
        curFun = newFun;
        funStack.push(newFun);
    }
}

function popFun() {
    if (!funStack.isEmpty()) {
        let fun = funStack.pop();
        if (!funStack.isEmpty()) {
            //栈内还有函数
            let funTemp: Fun = <Fun>funStack.peek();
            curFun = funTemp;
            switch (funTemp.funType) {
                case FUN_TYPE.GENERAL:
                    curScopeState = SCOPE_STATE.GENERAL_FUN;
                    break;
                case FUN_TYPE.INNER:
                    curScopeState = SCOPE_STATE.INNER_FUN;
                    break;
                case FUN_TYPE.STATIC:
                    curScopeState = SCOPE_STATE.STATIC_FUN;
            }
        } else {
            curFun = null;
            curScopeState = SCOPE_STATE.MODULE;
        }
        return fun
    }
}

export function pushBlock() {
    curBlockDepth++;
    curBlockID = createUniqueId();
    let blockStatement: BlockStmt = new BlockStmt(curBlockID, curBlockDepth, blockStack.peek());
    blockStack.push(blockStatement);
}

function popBlock(): BlockStmt | null {
    if (!blockStack.isEmpty()) {
        let block: BlockStmt = blockStack.pop();
        if (!blockStack.isEmpty()) {
            let blockTemp = blockStack.peek();
            curBlockDepth = (<BlockStmt>blockTemp).blockDepth;
            curBlockID = (<BlockStmt>blockTemp).blockID;
        } else {
            curBlockDepth = 0;
            curBlockID = "";
        }
        return block;
    }
    return null;
}

function hasNull(list: Array<Node>): boolean {
    let flag = false;
    for (let i = 0; i < list.length; i++) {
        if (!list[i]) {
            flag = true;
            break;
        }
    }
    return flag;
}

//TODO 添加错误处理机制
export function initBuildAST() {
    //初始化AST构建程序
    interpreterInfo = getInterpreterInfo();
    ASTStack = new Stack<Node>();
    blockStack = new Stack<BlockStmt>();
    funStack = new Stack<Fun>();
    hasImport = false;
    qsModule = new QSModule();
    symbolTable = getSymbolTable();
    curFun = null;
    curBlockDepth = 0;
    curScopeState = SCOPE_STATE.MODULE;//默认是处于模块作用域中
    curBlockID = "";
}

//状态树构建方法表
let ASTBuildMap = {
    [V.ModuleSelfDefine]: buildModuleSelfDefine,
    [V.ModuleImportDefine]: buildModuleImportDefine,
    [V.ModuleExport]: buildModuleExport,
    [V.FunDefStmt]: buildFunDefStmt,
    [V.FunDef]: buildFunDef,
    [V.ParamList]: buildParamList,
    [V.Stmts]: buildStmts,
    [V.BlockStmt]: buildBlockStmt,
    [V.VariableDef]: buildVariableDef,
    [V.VariableExp]: buildVariableExp,
    [V.VarDefStmt]: buildVarDefStmt,
    [V.InnerFunDefStmt]: buildInnerFunDefStmt,
    [V.IfStmt]: buildIfStmt,
    [V.WhileStmt]: buildWhileStmt,
    [V.ReturnStmt]: buildReturnStmt,
    [V.AssignStmt]: buildAssignStmt,
    [V.Exp]: buildExp,
    [V.ArrayExp]: buildArrayExp,
    [V.ArrayItems]: buildArrayItems,
    [V.ArrayItem]: buildArrayItem,
    [V.ArrayMemberExp]: buildArrayMemberExp,
    [V.ArraySub]: buildArraySub,
    [V.CallExp]: buildCallExp,
    [V.ArgumentList]: buildArgumentList,
    [V.CalExp]: buildBinaryExp,
    [V.LogicOperator]: buildOperator,
    [V.LogicExp]: buildBinaryExp,
    [V.BitOperator]: buildOperator,
    [V.BitExp]: buildBinaryExp,
    [V.RelationalOperator]: buildOperator,
    [V.RelationExp]: buildBinaryExp,
    [V.AdditiveOperator]: buildOperator,
    [V.AdditiveExp]: buildBinaryExp,
    [V.FactorOperator]: buildOperator,
    [V.FactorExp]: buildFactorExp,
    [V.UnaryBeforeOperator]: buildOperator,
    [V.UnaryAfterOperator]: buildOperator,
    [V.UnaryExp]: buildUnaryExp,
    [V.Literal]: buildLiteral,
};

//该文件用于构建抽象语法树每一个子节点，同时在栈中保存已经生成的语法树节点
export function getParsedModule(): QSModule {
    //获取解析后的模块
    return qsModule;
}

export function transferVTToASTNode(vtWrap: V_T_Wrap) {
    //将vtWrap转化为AST上的节点，只用于直接推导，因为此处是构建状态树，所以传来的必定是非终结符
    let call: Function = ASTBuildMap[vtWrap.getSymbolValue(false)];
    if (call) {
        let node: Node | undefined = call(vtWrap);
        if (node)
            ASTStack.push(node);
    }
}


function notSupport() {
    console.log("代码中有暂不支持的语法元素，请检查代码！");
    kill();
}


function pushVariableToSymbolTable(varDef: VarDefStmt) {
    //将变量统一加入到符号表中
    //判断当前所处的作用域
    if (curScopeState === SCOPE_STATE.MODULE) {
        //处于模块作用域中
        let variable: Variable = new Variable(qsModule.moduleName, varDef.id, varDef.init);
        symbolTable.pushVariable(variable);
    } else if (curScopeState === SCOPE_STATE.GENERAL_FUN) {
        //处于普通函数作用域下
        let variable: Variable = new Variable(qsModule.moduleName, varDef.id, varDef.init, curBlockDepth, curBlockID);
        symbolTable.pushVariable(variable);
    } else {
        //TODO 暂不支持静态函数与内部函数
    }
}

//以下为各个非终结符节点的构建方式，同时添加程序的语义

function buildModuleSelfDefine(vtWrap: V_T_Wrap) {
    let moduleName: Token = <Token>vtWrap.getChildToken(ID);
    if (moduleName) {
        qsModule.moduleName = moduleName.value;
    }
}

function buildModuleImportDefine(vtWrap: V_T_Wrap) {
    let importModule: Token = <Token>vtWrap.getChildToken(ID);
    if (importModule) {
        qsModule.pushImport(importModule.value);
    }
}

function buildModuleExport(vtWrap: V_T_Wrap) {
    let exportName: Token = <Token>vtWrap.getChildToken(ID);
    if (exportName) {
        qsModule.pushExport(exportName.value);
    }
}

function buildFunDefStmt() {
    //将函数加入到符号表中
    let fun: Fun = <Fun>popFun();
    if (fun) {
        symbolTable.pushFun(fun);
        if (fun.funName === MAIN) {
            //main函数入口
            interpreterInfo.setEnter(fun);
        }
    }
}

function buildFunDef(vtWrap: V_T_Wrap) {
    //构建函数
    let idToken = <Token>vtWrap.getChildToken(ID);
    if (idToken && idToken.value === (<Fun>curFun).funName) {
        //id存在，且与当前函数名一致
        let nodeList = ASTStack.popX(2);
        if (!hasNull(nodeList)) {
            //没有空值
            let funDeclaration: FunDeclaration = new FunDeclaration(idToken.value, <ParamList>nodeList[0], <BlockStmt>nodeList[1]);
            if (curFun) {
                curFun.setFunDefNode(funDeclaration);
            }
        }
    }
}

function buildParamList(vtWrap: V_T_Wrap) {
    if (!vtWrap.isNull) {
        //没有使用空字符匹配
        let idToken: Token = <Token>vtWrap.getChildToken(ID);
        if (idToken) {
            if (vtWrap.testChild(COMMA)) {
                //该参数列表有多个参数
                let paramList: ParamList = <ParamList>ASTStack.pop();
                if (paramList instanceof ParamList) {
                    paramList.pushParam(idToken.value);
                    return paramList;
                }
            } else {
                //只有一个参数
                let paramList: ParamList = new ParamList();
                paramList.pushParam(idToken.value);
                return paramList;
            }
        }
    } else {
        return new ParamList();//返回一个空的paramList用于占位
    }
}

function buildStmts(vtWrap: V_T_Wrap) {//将所有的stmt添加到栈顶的block中
    if (!vtWrap.isNull) {
        //不是空字符
        let stmt: Statement = <Statement>ASTStack.pop();
        if (stmt) {
            let blockStatement: BlockStmt = <BlockStmt>blockStack.peek();
            if (blockStatement) {
                blockStatement.pushStmt(stmt);
            }
        }
    }
}

function buildBlockStmt() {
    //规约block
    let blockStatement: BlockStmt = <BlockStmt>popBlock();
    if (blockStatement) {
        return blockStatement;
    }
}


function buildVariableDef(vtWrap: V_T_Wrap) {
    //模块、局部以及静态变量定义
    if (vtWrap.testChild(STATIC)) {
        //静态变量 TODO 先不支持，需要判断当前是否处于静态函数内部
        /*   if (curScopeState === SCOPE_STATE.STATIC_FUN) {
               //当前处于静态函数内，则可以添加静态变量
               //静态变量直接放入静态函数的符号表中
               let staticFun: Fun = <Fun>funStack.peek();
               let varDefStmt: VarDefStmt = <VarDefStmt>ASTStack.pop();
               let variable: Variable = new Variable(varDefStmt, qsModule.moduleName, curBlockDepth, curBlockID, true);
               staticFun.pushStaticValue(variable)
           } else {
               console.log("静态变量只可以在静态函数中！！")
           }*/
    } else {
        //不是静态变量，则加入到全局符号表中
        let varDefStmt: VarDefStmt = <VarDefStmt>ASTStack.pop();
        if (varDefStmt instanceof VarDefStmt) {
            pushVariableToSymbolTable(varDefStmt);
            return varDefStmt;
        }
    }
}

function buildVariableExp(vtWrap: V_T_Wrap) {
    let idToken: Token = <Token>vtWrap.getChildToken(ID);
    if (idToken) {
        return new VariableExp(idToken.value);
    }
}

function buildVarDefStmt(vtWrap: V_T_Wrap) {
    //变量定义，无关类型
    let idToken: Token = <Token>vtWrap.getChildToken(ID);
    if (idToken) {
        if (vtWrap.testChild(EXP)) {
            //有初始化的值
            let expression: Exp = <Exp>ASTStack.pop();
            if (expression instanceof Exp) {
                return new VarDefStmt(idToken.value, expression);
            }
        } else {
            //没有初始化的值
            return new VarDefStmt(idToken.value)
        }
    }
}

function buildWhileStmt() {
    let whileStmtNodeList = ASTStack.popX(2);
    if (!hasNull(whileStmtNodeList)) {
        //没有空值
        return new WhileStmt(<Expression>whileStmtNodeList[0], <Statement>whileStmtNodeList[1]);
    }
}

function buildCallExp(vtWrap: V_T_Wrap) {
    let idToken: Token = <Token>vtWrap.getChildToken(ID);
    if (idToken) {
        let argumentList: ArgumentList = <ArgumentList>ASTStack.pop();
        if (argumentList instanceof ArgumentList) {
            return new CallExp(idToken.value, argumentList);
        }
    }
}

function buildArgumentList(vtWrap: V_T_Wrap) {
    if (!vtWrap.isNull) {
        if (vtWrap.testChild(COMMA)) {
            //如果有多个实参
            let nodeList = ASTStack.popX(2);
            if (!hasNull(nodeList)) {
                let argumentList: ArgumentList = <ArgumentList>nodeList[0];
                argumentList.pushArgs(<Exp>nodeList[1]);
                return argumentList;
            }
        } else {
            //只有一个实参
            let exp: Exp = <Exp>ASTStack.pop();
            if (exp instanceof Exp) {
                let argumentList: ArgumentList = new ArgumentList();
                argumentList.pushArgs(exp);
                return argumentList;
            }
        }
    } else {
        return new ArgumentList();//返回一个空的实参列表，用于占位
    }
}

function buildReturnStmt(vtWrap: V_T_Wrap) {
    if (vtWrap.childNums === 2) {
        //没有返回值
        return new ReturnStmt()
    } else if (vtWrap.testChild(EXP)) {
        //有返回值
        let exp: Exp = <Exp>ASTStack.pop();
        if (exp instanceof Exp) {
            return new ReturnStmt(exp)
        }
    }
}

function buildAssignStmt() {
    let exp: Exp = <Exp>ASTStack.pop();
    let variableExp: VariableExp = <VariableExp>ASTStack.pop();
    if (exp instanceof Exp && variableExp instanceof VariableExp) {
        return new AssignStmt(variableExp, exp);
    }

}

function buildExp() {
    let exp: Expression = <Expression>ASTStack.pop();
    if (exp) {
        //包装为表达式
        return new Exp(exp);
    }
}


function buildArraySub(vtWrap: V_T_Wrap) {
    if (vtWrap.testChild(ARRAY_SUB)) {
        let arraySub: ArraySub = <ArraySub>ASTStack.pop();
        if (arraySub instanceof ArraySub) {
            let exp: Exp = <Exp>ASTStack.pop();
            if (exp instanceof Exp) {
                arraySub.pushSub(exp);
                return arraySub;
            }
        }
    } else {
        let exp: Exp = <Exp>ASTStack.pop();
        if (exp instanceof Exp) {
            return new ArraySub(exp);
        }
    }
}


function buildOperator(vtWrap: V_T_Wrap) {
    //构建所有的运算符
    let operatorToken: Token = <Token>vtWrap.getChildTokenByList(OPERATOR_LIST);
    if (operatorToken) {
        let operator;
        switch (operatorToken.tokenType) {
            case T.BIT_NOT:
                operator = new Operator(OPERATOR_TYPE.UNARY_OPERATOR, OPERATOR.BIT_NOT);
                break;
            case T.NOT:
                operator = new Operator(OPERATOR_TYPE.UNARY_OPERATOR, OPERATOR.NOT);
                break;
            case T.ADD_ONE:
                operator = new Operator(OPERATOR_TYPE.UNARY_OPERATOR, OPERATOR.ADD_ONE);
                break;
            case T.SUB_ONE:
                operator = new Operator(OPERATOR_TYPE.UNARY_OPERATOR, OPERATOR.SUB_ONE);
                break;
            case T.MOD:
                operator = new Operator(OPERATOR_TYPE.ARITHMETIC_OPERATOR, OPERATOR.MOD);
                break;
            case T.DIV:
                operator = new Operator(OPERATOR_TYPE.ARITHMETIC_OPERATOR, OPERATOR.DIV);
                break;
            case T.MUL:
                operator = new Operator(OPERATOR_TYPE.ARITHMETIC_OPERATOR, OPERATOR.MUL);
                break;
            case T.ADD:
                operator = new Operator(OPERATOR_TYPE.ARITHMETIC_OPERATOR, OPERATOR.ADD);
                break;
            case T.SUB:
                operator = new Operator(OPERATOR_TYPE.ARITHMETIC_OPERATOR, OPERATOR.SUB);
                break;
            case T.BIT_AND:
                operator = new Operator(OPERATOR_TYPE.ARITHMETIC_OPERATOR, OPERATOR.BIT_AND);
                break;
            case T.BIT_OR:
                operator = new Operator(OPERATOR_TYPE.ARITHMETIC_OPERATOR, OPERATOR.BIT_OR);
                break;
            case T.LESS:
                operator = new Operator(OPERATOR_TYPE.LOGICAL_OPERATOR, OPERATOR.LESS);
                break;
            case T.LESS_EQUAL:
                operator = new Operator(OPERATOR_TYPE.LOGICAL_OPERATOR, OPERATOR.LESS_EQUAL);
                break;
            case T.EQUAL:
                operator = new Operator(OPERATOR_TYPE.LOGICAL_OPERATOR, OPERATOR.EQUAL);
                break;
            case T.NOT_EQUAL:
                operator = new Operator(OPERATOR_TYPE.LOGICAL_OPERATOR, OPERATOR.NOT_EQUAL);
                break;
            case T.GREATER:
                operator = new Operator(OPERATOR_TYPE.LOGICAL_OPERATOR, OPERATOR.GREATER);
                break;
            case T.LOGIC_OR:
                operator = new Operator(OPERATOR_TYPE.LOGICAL_OPERATOR, OPERATOR.LOGIC_OR);
                break;
            case T.LOGIC_AND:
                operator = new Operator(OPERATOR_TYPE.LOGICAL_OPERATOR, OPERATOR.LOGIC_AND);
                break;
        }
        if (operator) {
            return operator;
        }
    }
}

function buildBinaryExp(vtWrap: V_T_Wrap) {
    //构建二元运算，因为二元运算比较通用，所以直接统一构建，对于规约的时候只有单个节点的产生式直接忽视，
    // 因为对其做规约无意义，只会增加树的深度，不会增加语义
    if (vtWrap.childNums !== 1) {
        let binaryExpList: Array<Node> = ASTStack.popX(3);
        //二元运算的子节点都是三个
        //检查是否为空
        if (!hasNull(binaryExpList)) {
            return new BinaryExp(<Operator>binaryExpList[1], <Expression>binaryExpList[0], <Expression>binaryExpList[2]);
        }
    }
}

function buildFactorExp(vtWrap: V_T_Wrap) {
    let unaryExp: UnaryExp | null = null;
    let operator: Operator | null = null;
    if (vtWrap.testChild(UNARY_BEFORE_OPERATOR)) {
        //前缀运算符
        unaryExp = <UnaryExp>ASTStack.pop();
        operator = <Operator>ASTStack.pop();
        unaryExp.isPreOperator = true;
    } else if (vtWrap.testChild(UNARY_AFTER_OPERATOR)) {
        //后缀运算符
        operator = <Operator>ASTStack.pop();
        unaryExp = <UnaryExp>ASTStack.pop();
    }
    if (unaryExp && operator) {
        unaryExp.setOperator(operator);
        return unaryExp;
    }
}

function buildUnaryExp() {
    let value: Expression = <Expression>ASTStack.pop();
    if (value instanceof Literal || value instanceof VariableExp || value instanceof Exp || value instanceof CallExp) {
        return new UnaryExp(value);
    }
}


function buildLiteral(vtWrap: V_T_Wrap) {
    //构建字面量
    let valueToken: Token = <Token>vtWrap.getChildTokenByList([NUMBER, STRING, FALSE, TRUE, NULL]);
    if (valueToken) {
        let value: number | string | boolean | null;
        switch (valueToken.tokenType) {
            case T.NUMBER:
                value = Number.parseFloat(valueToken.value);
                break;
            case T.STRING:
                value = valueToken.value;
                break;
            case T.FALSE:
                value = false;
                break;
            case T.TRUE:
                value = true;
                break;
            default:
                value = null;
                break;
        }
        return new Literal(value);
    }
}

function buildArrayExp() {
    notSupport()
}

function buildArrayItems(vtWrap: V_T_Wrap) {
    notSupport()
}

function buildArrayItem(vtWrap: V_T_Wrap) {
    notSupport()
}

function buildArrayMemberExp(vtWrap: V_T_Wrap) {
    notSupport()
}


function buildInnerFunDefStmt() {
    notSupport()
}

function buildIfStmt() {
    notSupport()
}
