import {Stack} from "./DataStruct/Stack";
import {
    ArgumentList, ArraySub, AssignExp,
    BinaryArithmeticExp, BlockStatement, CallExp,
    Exp,
    Expression,
    FunDeclaration,
    IDNode,
    Literal, MemberExp,
    Node,
    OPERATOR,
    Operator,
    OPERATOR_TYPE, ParamList, ReturnStmt, Statement,
    UnaryExp,
    VarDecStmt,
    VarDefStmt, WhileStmt
} from "./DataStruct/ASTNode";
import {V_T_Wrap} from "./DataStruct/V_T_Wrap";
import {T, V} from "./DataStruct/V_T";
import {
    ARRAY_SUB,
    COMMA, EXP,
    FALSE,
    FUN_DEF_STMT,
    ID, MEMBER_EXP,
    NULL,
    NUMBER,
    OPERATOR_LIST,
    STRING,
    TRUE,
} from "./DataStruct/TConstant";
import {QSModule} from "../Interpreter/Module";
import {Token} from "../Lexer/Datastruct/Token";
import {Fun} from "../Interpreter/Fun";
import {getSymbolTable, SymbolTable} from "../Interpreter/SymbolTable";
import {Variable} from "../Interpreter/Variable";
import {createUniqueId} from "../Utils/utils";

let ASTStack: Stack<Node>;
let blockStack: Stack<BlockStatement>;
let hasImport = false;
let qsModule: QSModule;
let symbolTable: SymbolTable;
let curScopeState: SCOPE_STATE;
let curFunName: string = "";//当前所处方法名
let curBlockDepth: number = 0;//当前所处scope的深度
let curBlockID: string = "";//当前所处scope的ID
//构建AST时目前所处的作用域
enum SCOPE_STATE {
    MODULE,//模块作用域
    FUNCTION//方法作用域
}

export function pushBlock() {
    curBlockDepth++;
    curBlockID = createUniqueId();
    let blockStatement: BlockStatement = new BlockStatement(curBlockID, curBlockDepth);
    blockStack.push(blockStatement);
}

export function setCurFunName(funName: string) {
    curFunName = funName;
    curScopeState = SCOPE_STATE.FUNCTION;
}

function popBlock(): BlockStatement | null {
    if (!blockStack.isEmpty()) {
        let block: BlockStatement = blockStack.pop();
        if (!blockStack.isEmpty()) {
            let blockTemp = blockStack.peek();
            curBlockDepth = (<BlockStatement>blockTemp).blockDepth;
            curBlockID = (<BlockStatement>blockTemp).blockID;
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
    ASTStack = new Stack<Node>();
    blockStack = new Stack<BlockStatement>();
    hasImport = false;
    qsModule = new QSModule();
    symbolTable = getSymbolTable();
    curBlockDepth = 0;
    curScopeState = SCOPE_STATE.MODULE;//默认是处于模块作用域中
    curFunName = "";
    curBlockID = "";
}

//状态树构建方法表
let ASTBuildMap = {
    [V.ModuleSelfDefine]: buildModuleSelfDefine,
    [V.ModuleImportDefine]: buildModuleImportDefine,
    [V.ModuleExport]: buildModuleExport,
    [V.ModuleStmts]: buildModuleStmts,
    [V.Literal]: buildLiteral,
    [V.UnaryExp]: buildUnaryExp,
    [V.FactorExp]: buildFactorExp,
    [V.AdditiveExp]: buildBinaryExp,
    [V.RelationExp]: buildBinaryExp,
    [V.BitExp]: buildBinaryExp,
    [V.LogicExp]: buildBinaryExp,
    [V.CalExp]: buildBinaryExp,
    [V.Exp]: buildExp,
    [V.VarDefStmt]: buildVarDefStmt,
    [V.VarDecStmt]: buildVarDecStmt,
    [V.UnaryOperator]: buildOperator,
    [V.FactorOperator]: buildOperator,
    [V.AdditiveOperator]: buildOperator,
    [V.BitOperator]: buildOperator,
    [V.LogicOperator]: buildOperator,
    [V.RelationalOperator]: buildOperator,
    [V.FunDefStmt]: buildFunDefStmt,
    [V.ParamList]: buildParamList,
    [V.BlockStmt]: buildBlockStmt,
    [V.Stmts]: buildStmts,
    [V.WhileStmt]: buildWhileStmt,
    [V.CallExp]: buildCallExp,
    [V.ArgumentList]: buildArgumentList,
    [V.ArraySub]:buildArraySub,


};

//该文件用于构建抽象语法树每一个子节点，同时在栈中保存已经生成的语法树节点
export function getParsedModule(): QSModule | null {
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

function pushVariableToSymbolTable(varDef: VarDefStmt) {
    //将变量统一加入到符号表中
    //判断当前所处的作用域
    if (curScopeState === SCOPE_STATE.MODULE) {
        //处于模块作用域中
        let variable: Variable = new Variable(varDef, qsModule.moduleName);
        symbolTable.pushVariable(variable);
    } else {
        //处于函数作用域下
        let variable: Variable = new Variable(varDef, qsModule.moduleName, curFunName, curBlockDepth, curBlockID);
        symbolTable.pushVariable(variable);
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


function buildModuleStmts(vtWrap: V_T_Wrap) {
    if (!vtWrap.isNull) {
        //也就是说没有用空字符来进行规约
        if (vtWrap.testChild(FUN_DEF_STMT)) {
            //如果是用来规约函数定义到模块语句的
            let funDef: FunDeclaration = <FunDeclaration>ASTStack.pop();
            if (funDef) {
                let fun: Fun = <Fun>symbolTable.getFun(qsModule.moduleName, funDef.id.name);
                if (fun) {
                    qsModule.pushFun(fun);
                }
            }
        } else {
            //否则就是规约模块变量定义
            let varDef: VarDefStmt = <VarDefStmt>ASTStack.pop();
            if (varDef) {
                let variable: Variable = <Variable>symbolTable.getVariable(qsModule.moduleName, varDef.id.name);
                if (variable) {
                    qsModule.pushModuleVar(variable);
                }
            }
        }
    }
}

function buildFunDefStmt(vtWrap: V_T_Wrap) {
    let idToken = <Token>vtWrap.getChildToken(ID);
    if (idToken && idToken.value === curFunName) {
        //id存在，且与当前方法名一致
        let idNode: IDNode = new IDNode(curFunName);
        let nodeList = ASTStack.popX(2);
        if (!hasNull(nodeList)) {
            //没有空值
            curBlockDepth = 0;
            curScopeState = SCOPE_STATE.MODULE;
            curBlockID = "";
            curFunName = "";
            let funDecl: FunDeclaration = new FunDeclaration(idNode, <ParamList>nodeList[0], <BlockStatement>nodeList[1]);
            let fun: Fun = new Fun(funDecl, qsModule.moduleName);
            symbolTable.pushFun(fun);
            return funDecl;
        }
    }
}

function buildParamList(vtWrap: V_T_Wrap) {
    if (!vtWrap.isNull) {
        //没有使用空字符匹配
        let idToken: Token = <Token>vtWrap.getChildToken(ID);
        if (idToken) {
            let idNode: IDNode = new IDNode(idToken.value);
            if (vtWrap.testChild(COMMA)) {
                //该参数列表有多个参数
                let paramList: ParamList = <ParamList>ASTStack.pop();
                if (paramList) {
                    paramList.pushParam(idNode);
                    return paramList;
                }
            } else {
                //只有一个参数
                let paramList: ParamList = new ParamList();
                paramList.pushParam(idNode);
                return paramList;
            }
        }
    } else {
        return new ParamList();//返回一个空的paramList用于占位
    }
}

function buildBlockStmt() {
    let blockStatement: BlockStatement = <BlockStatement>popBlock();
    if (blockStatement) {
        return blockStatement;
    }
}

function buildStmts(vtWrap: V_T_Wrap) {
    if (!vtWrap.isNull) {
        let stmt: Statement = <Statement>ASTStack.pop();
        if (stmt) {
            let blockStatement: BlockStatement = <BlockStatement>blockStack.peek();
            if (blockStatement) {
                blockStatement.pushStmt(stmt);
            }
        }
    }
}

function buildVarDefStmt(vtWrap: V_T_Wrap) {
    let varDefStmt: VarDefStmt | null = null;
    if (vtWrap.childNums === 1) {
        //只可能是VarDecStmt
        let varDecStmt: VarDecStmt = <VarDecStmt>ASTStack.pop();
        if (varDecStmt) {
            varDefStmt = new VarDefStmt(varDecStmt.id)
        }
    } else {
        let expression: Exp = <Exp>ASTStack.pop();
        if (expression) {
            let IDToken: Token = <Token>vtWrap.getChildToken(ID);
            if (IDToken) {
                let idNode = new IDNode(IDToken.value);
                varDefStmt = new VarDefStmt(idNode, expression);
            }
        }
    }
    if (varDefStmt) {
        pushVariableToSymbolTable(varDefStmt);
        return varDefStmt;
    }
}

function buildVarDecStmt(vtWrap: V_T_Wrap) {
    let idToken: Token = <Token>vtWrap.getChildToken(ID);
    let idNode: IDNode = new IDNode(idToken.value);
    return new VarDecStmt(idNode);
}

function buildWhileStmt() {
    let whileStmtNodeList = ASTStack.popX(2);
    if (!hasNull(whileStmtNodeList)) {
        //没有空值
        return new WhileStmt(<Expression>whileStmtNodeList[0], <Statement>whileStmtNodeList[1]);
    }
}

function buildCallExp(vtWrap: V_T_Wrap) {
    let idToken = <Token>vtWrap.getChildToken(ID);
    if (idToken) {
        let idNode: IDNode = new IDNode(idToken.value);
        let argumentList: ArgumentList = <ArgumentList>ASTStack.pop();
        if (argumentList) {
            return new CallExp(idNode, argumentList);
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
            if (exp) {
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
        if (exp) {
            return new ReturnStmt(exp)
        }
    }
}

function buildAssignStmt(vtWrap: V_T_Wrap) {
    if (vtWrap.testChild(ID)) {
        let idToken: Token = <Token>vtWrap.getChildToken(ID);
        let exp: Exp = <Exp>ASTStack.pop();
        if (exp) {
            let idNode: IDNode = new IDNode(idToken.value);
            return new AssignExp(idNode, exp);
        }
    } else if (vtWrap.testChild(MEMBER_EXP)) {
        let nodeList = ASTStack.popX(2);
        if (!hasNull(nodeList)) {
            return new AssignExp(<MemberExp>nodeList[0], <Exp>nodeList[1]);
        }
    }
}

function buildExp() {
    let exp: Expression = <Expression>ASTStack.pop();
    if (exp) {
        //包装为表达式
        return new Exp(exp);
    }
}

function buildMemberExp(vtWrap: V_T_Wrap) {
}

function buildArraySub(vtWrap: V_T_Wrap) {
    if (vtWrap.testChild(ARRAY_SUB)) {
        let arraySub: ArraySub = <ArraySub>ASTStack.pop();
        if (arraySub) {
            let exp: Exp = <Exp>ASTStack.pop();
            arraySub.pushSub(exp);
            return arraySub;
        }
    } else {
        let exp: Exp = <Exp>ASTStack.pop();
        return new ArraySub(exp);
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
            return new BinaryArithmeticExp(<Operator>binaryExpList[1], <Expression>binaryExpList[0], <Expression>binaryExpList[2]);
        }
    }
}

function buildUnaryExp(vtWrap: V_T_Wrap) {
    let token: Token = <Token>vtWrap.getChildToken(ID);
    if (token) {
        //如果是终结符，则表示只可能是ID
        return new UnaryExp(new IDNode(token.value));
    } else {
        if (vtWrap.childNums === 1) {
            //只可能是literal
            let literal: Literal = <Literal>ASTStack.pop();
            if (literal) {
                //将literal包装为一元运算
                return new UnaryExp(literal);
            }
        } else {
            //只可能是加括号的表达式，对其进行包装
            let exp: Exp = <Exp>ASTStack.pop();
            if (exp) {
                return new UnaryExp(exp);
            }
        }
    }
}

function buildFactorExp(vtWrap: V_T_Wrap) {
    if (vtWrap.childNums !== 1) {
        let unaryExp: UnaryExp = <UnaryExp>ASTStack.pop();
        let operator: Operator = <Operator>ASTStack.pop();
        if (unaryExp && operator) {
            unaryExp.setOperator(operator);
            return unaryExp;
        }
    }
}

function buildObjectExp(vtWrap: V_T_Wrap) {
    popBlock();
}
