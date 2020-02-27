import {Stack} from "./DataStruct/Stack";
import {
    Exp,
    Expression,
    FunDeclaration,
    IDNode,
    Literal,
    Node,
    OPERATOR,
    Operator,
    OPERATOR_TYPE,
    UnaryExp,
    VarDecStmt,
    VarDefStmt
} from "./DataStruct/AST";
import {V_T_Wrap} from "./DataStruct/V_T_Wrap";
import {T, V} from "./DataStruct/V_T";
import {FALSE, FUN_DEF_STMT, ID, NULL, NUMBER, OPERATOR_LIST, STRING, TRUE} from "./DataStruct/Constant";
import {QSModule} from "../Interpreter/Module";
import {Token} from "../Lexer/Datastruct/Token";
import {Fun} from "../Interpreter/Fun";
import {SymbolTable} from "../Interpreter/SymbolTable";
import {Variable} from "../Interpreter/Variable";

let ASTStack: Stack<Node> = new Stack<Node>();
let hasImport = false;
let qsModule: QSModule;
let symbolTable: SymbolTable;
//TODO 添加错误处理机制

//状态树构建方法表
let ASTBuildMap = {
    [V.ModuleSelfDefine]: buildModuleSelfDefine,
    [V.ModuleImportDefine]: buildModuleImportDefine,
    [V.ModuleExport]: buildModuleExport,
    [V.ModuleStmts]: buildModuleStmts,
    [V.Literal]: buildLiteral,
    [V.UnaryExp]: buildUnaryExp,
    [V.FactorExp]: buildFactorExp,
    [V.AdditiveExp]: buildAdditiveExp,
    [V.RelationExp]: buildRelationExp,
    [V.BitExp]: buildBitExp,
    [V.BitExp]: buildLogicExp,
    [V.CalExp]: buildCalExp,
    [V.Exp]: buildExp,
    [V.VarDefStmt]: buildVarDefStmt,
    [V.VarDecStmt]: buildVarDecStmt,
    [V.UnaryOperator]: buildOperator,
    [V.FactorOperator]: buildOperator,
    [V.AdditiveOperator]: buildOperator,
    [V.BitOperator]: buildOperator,
    [V.LogicOperator]: buildOperator,
    [V.RelationalOperator]: buildOperator,
};

//该文件用于构建抽象语法树每一个子节点，同时在栈中保存已经生成的语法树节点
export function getParsedModule(): QSModule | null {
    //获取解析后的模块
    return qsModule;
}

export function initBuildAST() {
    //初始化AST构建程序
    ASTStack = new Stack<Node>();
    hasImport = false;
    qsModule = new QSModule();
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

//以下为各个非终结符节点的构建方式，同时添加程序的语义

function buildModuleSelfDefine(vtWrap: V_T_Wrap) {
    let moduleName: Token = <Token>vtWrap.getChildToken(ID);
    if (moduleName) {
        qsModule.moduleName = moduleName.value;
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
    //构建运算符
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
            case T.LOGIN_AND:
                operator = new Operator(OPERATOR_TYPE.LOGICAL_OPERATOR, OPERATOR.LOGIC_AND);
                break;
        }
        if (operator) {
            return operator;
        }
    }
}

function buildUnaryExp(vtWrap: V_T_Wrap) {
    if (vtWrap.isT) {
        //如果是终结符，则表示只可能是ID
        let token: Token = <Token>vtWrap.getChildToken(ID);
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
            //只可能是加括号的表达式
            //TODO LEFT_PAREN Exp RIGHT_PAREN
        }
    }
}

function buildFactorExp(vtWrap: V_T_Wrap) {
    if (vtWrap.childNums !== 1) {
        //TODO UnaryOperator UnaryExp
        let unaryExp: UnaryExp = <UnaryExp>ASTStack.pop();
        unaryExp.operator = <Operator>ASTStack.pop();
        return unaryExp;
    }
}

function buildAdditiveExp(vtWrap: V_T_Wrap) {
    if (vtWrap.childNums !== 1) {
        //TODO AdditiveExp FactorOperator FactorExp

    }
}


function buildRelationExp(vtWrap: V_T_Wrap) {
    if (vtWrap.childNums !== 1) {
        //TODO RelationExp AdditiveOperator AdditiveExp

    }
}

function buildBitExp(vtWrap: V_T_Wrap) {
    if (vtWrap.childNums !== 1) {
        //TODO BitExp RelationalOperator  RelationExp

    }
}

function buildLogicExp(vtWrap: V_T_Wrap) {
    if (vtWrap.childNums !== 1) {
        //TODO LogicExp BitOperator BitExp

    }
}

function buildCalExp(vtWrap: V_T_Wrap) {
    if (vtWrap.childNums !== 1) {
        //TODO CalExp LogicOperator LogicExp
    }
}

function buildExp(vtWrap: V_T_Wrap) {
    let exp: Expression = <Expression>ASTStack.pop();
    if (exp) {
        return new Exp(exp);
    } else {

    }
}

function buildVarDefStmt(vtWrap: V_T_Wrap) {
    if (vtWrap.childNums === 1) {
        //只可能是VarDecStmt
        let varDecStmt: VarDecStmt = <VarDecStmt>ASTStack.pop();
        if (varDecStmt) {
            return new VarDefStmt(varDecStmt.id)
        }
    } else {
        let expression: Exp = <Exp>ASTStack.pop();
        if (expression) {
            let IDToken: Token = <Token>vtWrap.getChildToken(ID);
            if (IDToken) {
                let idNode = new IDNode(IDToken.value);
                return new VarDefStmt(idNode, expression);
            }
        }
    }
}

function buildVarDecStmt(vtWrap: V_T_Wrap) {
    let idToken: Token = <Token>vtWrap.getChildToken(ID);
    let idNode: IDNode = new IDNode(idToken.value);
    return new VarDecStmt(idNode);
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
                qsModule.pushFun(new Fun(funDef));
            }
        } else {
            //否则就是规约模块变量定义
            let varDef: VarDefStmt = <VarDefStmt>ASTStack.pop();
            if (varDef) {
                let variable: Variable = new Variable(varDef, qsModule.moduleName);
                qsModule.pushModuleVar(variable);
            }
        }
    }

}