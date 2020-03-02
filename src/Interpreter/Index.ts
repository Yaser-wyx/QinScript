import {getInterpreterInfo, InterpreterInfo} from "./InterpreterInfo";
import {Fun} from "./Fun";
import {Stack} from "../Parser/DataStruct/Stack";
import {getSymbolTable, SymbolTable} from "./SymbolTable";
import {printFatalError} from "../error/error";
import {BlockStmt, Exp, Expression, NODE_TYPE, VarDefStmt} from "../Parser/DataStruct/ASTNode";
import {Variable, varTypePair} from "./Variable";

let runTimeStack = new Stack();//运行时栈
let interpreterInfo: InterpreterInfo;
let symbolTable: SymbolTable;

function pushToStack(value) {
    runTimeStack.push(value);
}

function popFromStack() {
    return runTimeStack.pop();
}

let curBlock = (): BlockStmt => {
    return <BlockStmt>interpreterInfo.curBlock;
};
let curModuleName = (): string => {
    return <string>interpreterInfo.curModuleName;
};

export function runInterpreter() {
    interpreterInfo = getInterpreterInfo();
    symbolTable = getSymbolTable();
    if (interpreterInfo.enter) {
        let mainFun = interpreterInfo.enter;
        interpreterInfo.setCurModule(mainFun.moduleName);
        runFun(mainFun);
    } else {
        printFatalError("缺少main函数！");
    }
}


function runFun(fun: Fun) {
    //执行fun
    pushToStack(interpreterInfo.curFun);//保存当前的fun
    interpreterInfo.curFun = fun;
    let block = fun.funBlock;
    if (block) {
        runBlockStmt(block);
    } else {
        printFatalError("函数体缺失！");
    }
    interpreterInfo.curFun = <Fun>popFromStack();//恢复fun
}

let statementExecutorMap = {
    [NODE_TYPE.ASSIGN_STMT]: runAssignStmt,
    [NODE_TYPE.BLOCK_STMT]: runBlockStmt,
    [NODE_TYPE.VAR_DEF_STMT]: runVarDefStmt,
    [NODE_TYPE.RETURN_STMT]: runReturnStmt,
    [NODE_TYPE.IF_STMT]: runIfStmt,
    [NODE_TYPE.WHILE_STMT]: runWhileStmt,
    [NODE_TYPE.EXPRESSION_STMT]: runExpression
};

function runBlockStmt(block: BlockStmt) {
    let body = block.body;
    pushToStack(interpreterInfo.curBlock);
    interpreterInfo.curBlock = block;
    for (let index = 0; index < body.length; index++) {
        let statement = body[index];//获取block中的语句
        let runner = statementExecutorMap[statement.nodeType];//获取执行器
        runner(statement);//执行
    }
    interpreterInfo.curBlock = <BlockStmt>popFromStack();
}

function runAssignStmt() {

}

function runVarDefStmt(varDefStmt: VarDefStmt) {
    let varName = varDefStmt.id.name;
    let block = curBlock();
    let variable: Variable = <Variable>symbolTable.getVariable(curModuleName(), varName, block.blockDepth, block.blockID);
    if (variable) {
        variable.hasDeclared = true;//对变量进行定义
        let initValue: Exp = <Exp>varDefStmt.init;
        if (initValue) {
            //有初始化的值，则进行初始化操作
            let varTypePair: varTypePair = runExpression(initValue);
        }
    } else {
        console.log(varName + "变量不存在！")
    }
}

function runReturnStmt() {

}

function runIfStmt() {

}

function runWhileStmt() {

}

let expressionExecutorMap = {
    [NODE_TYPE.CALL_EXPRESSION]: runCallExp,
    [NODE_TYPE.ARRAY_EXP]: runArrayExp,
    [NODE_TYPE.BINARY_EXP]: runBinaryExp,
    [NODE_TYPE.UNARY_EXP]: runUnaryExp,
    [NODE_TYPE.LITERAL]: runLiteral,
    [NODE_TYPE.VARIABLE_EXP]: runVariableExp,
    [NODE_TYPE.EXPRESSION_STMT]: runExpression
};

function runExpression(exp: Expression): varTypePair {

}

function runCallExp() {

}

function runArrayExp() {

}

function runBinaryExp() {

}

function runUnaryExp() {

}

function runLiteral() {

}

function runVariableExp() {

}
