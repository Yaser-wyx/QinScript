import {getInterpreterInfo, InterpreterInfo} from "./InterpreterInfo";
import {Fun} from "./Fun";
import {Stack} from "../Parser/DataStruct/Stack";
import {getSymbolTable, SymbolTable} from "./SymbolTable";
import {printFatalError} from "../error/error";
import {
    ArithmeticOperator,
    AssignStmt,
    BinaryExp,
    BlockStmt,
    CallExp,
    Exp,
    Expression,
    Literal,
    LogicalOperator,
    NODE_TYPE,
    OPERATOR, OPERATOR_TYPE,
    ReturnStmt,
    UnaryExp,
    VarDefStmt,
    VariableExp
} from "../Parser/DataStruct/ASTNode";
import {Variable, VARIABLE_TYPE, VarTypePair} from "./Variable";

let _ = require("lodash");

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
let curFun = (): Fun => {
    return <Fun>interpreterInfo.curFun;
};
let wrapToVarTypePair = (value: any, type: VARIABLE_TYPE, varName?: string): VarTypePair => {
    return new VarTypePair(value, type, varName);
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

function createTempSymbolTable(variables: Array<VarTypePair>): object {
    //根据传入的参数，创建临时符号表
    let easySymbolTable: object = {};//简易版符号表
    variables.forEach(variableTypePair => {
        let varName = variableTypePair.varName;
        if (varName) {
            let testVarIsInSymbolTable = symbolTable.getVariable(curModuleName(), varName, curBlock());
            if (!testVarIsInSymbolTable) {
                //不存在，可以进行定义与添加
                let variable: Variable = new Variable(curModuleName(), varName);
                variable.setValue(variableTypePair);
                variable.hasDeclared = true;
                easySymbolTable[varName] = variable;
            } else {
                printFatalError(varName + "重复定义！");
            }

        }
    });
    return easySymbolTable;
}

function runFun(fun: Fun) {
    //执行fun
    interpreterInfo.curFun = fun;
    //读取当前函数的参数
    let paramList: Array<VarTypePair> = [];
    fun.paramList.forEach(paramName => {
        let varTypePair = <VarTypePair>popFromStack();
        varTypePair.varName = paramName;
        paramList.push(varTypePair);
    });
    //获取简易符号表
    //将简易符号表挂载到当前fun中
    fun.easySymbolTable = createTempSymbolTable(paramList);
    let block = fun.funBlock;
    if (block) {
        return runBlockStmt(block);
    } else {
        printFatalError("函数体缺失！");
    }
    fun.easySymbolTable = {};//卸载简易符号表
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
    pushToStack(interpreterInfo.curBlock);//保存当前block
    interpreterInfo.curBlock = block;
    let blockValue: VarTypePair = new VarTypePair(null, VARIABLE_TYPE.NULL);
    for (let index = 0; index < body.length; index++) {
        let statement = body[index];//获取block中的语句
        let runner = statementExecutorMap[statement.nodeType];//获取执行器
        blockValue = runner(statement);//执行
    }
    interpreterInfo.curBlock = <BlockStmt>popFromStack();//恢复当前block
    return blockValue;
}

function runAssignStmt(assignStmt: AssignStmt) {
    let variable = runVariableExp(assignStmt.left);//获取要赋值的变量
    let value: VarTypePair = runExpression(assignStmt.right);//获取值
    variable.setValue(value);//赋值
}

function runVarDefStmt(varDefStmt: VarDefStmt) {
    let varName = varDefStmt.id;
    let variable: Variable = <Variable>getVariable(varName);
    if (variable) {
        variable.hasDeclared = true;//对变量进行定义
        let initValueExp: Exp = <Exp>variable.varInitExp;
        if (initValueExp) {
            //有初始化的值，则进行初始化操作
            let value = _.cloneDeep(runExpression(initValueExp));
            variable.setValue(value);
            console.log(variable)

        }
    } else {
        printFatalError(varName + "变量不存在 ！");
    }
}

function runReturnStmt(returnStmt: ReturnStmt) {
    curFun().isReturn = true;//设置当前函数要返回了
    if (returnStmt.argument) {
        return _.cloneDeep(runExpression(returnStmt.argument));
    } else {
        return wrapToVarTypePair(null, VARIABLE_TYPE.NULL);
    }
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

//对exp进行拆分
function runExpression(exp: Expression): VarTypePair {
    //根据exp的类型执行不同的表达式
    if (exp instanceof Exp) {
        let expExecutor = expressionExecutorMap[exp.exp.nodeType];
        return expExecutor(exp.exp);
    } else {
        let expExecutor = expressionExecutorMap[exp.nodeType];
        return expExecutor(exp);
    }
}

function runCallExp(callExp: CallExp) {
    //保存当前上下文环境
    pushToStack(interpreterInfo.curFun);
    //读取要调用的函数
    let fun: Fun = <Fun>symbolTable.getFun(curModuleName(), callExp.callee);
    if (fun && fun.paramList.length === callExp.argList.length) {
        //函数存在，且参数匹配
        //计算所有实参的值，并转化为值类型的表示法
        let args: Array<VarTypePair> = [];
        callExp.argList.forEach(argExp => {
            args.push(runExpression(argExp));
        });
        while (args.length > 0) {
            pushToStack(args.pop());//将实参从右至左压入栈中
        }
        //调用函数执行，并返回结果
        let value = runFun(fun);
        //恢复上下文环境
        interpreterInfo.curFun = <Fun>popFromStack();
        return value;
    } else {
        printFatalError("函数未定义 ")
    }
}

function runArrayExp() {

}

function handleArithmetic(left: VarTypePair, right: VarTypePair, operatorType: ArithmeticOperator) {
    let resValue: VarTypePair = new VarTypePair(null, VARIABLE_TYPE.NULL);//默认为null
    switch (operatorType) {
        case OPERATOR.ADD:
            resValue.value = left.value + right.value;
            break;
        case OPERATOR.BIT_AND:
            resValue.value = left.value & right.value;
            break;
        case OPERATOR.BIT_OR:
            resValue.value = left.value | right.value;
            break;
        case OPERATOR.DIV:
            resValue.value = left.value / right.value;
            break;
        case OPERATOR.MOD:
            resValue.value = left.value % right.value;
            break;
        case OPERATOR.MUL:
            resValue.value = left.value * right.value;
            break;
        case OPERATOR.SUB:
            resValue.value = left.value - right.value;
            break;
    }
    resValue.type = setValueType(resValue.value);
    console.log(resValue)

    return resValue;
}

function handleLogic(left: VarTypePair, right: VarTypePair, operatorType: LogicalOperator) {
    let resValue: VarTypePair = new VarTypePair(null, VARIABLE_TYPE.NULL);//默认为null
    switch (operatorType) {
        case OPERATOR.EQUAL:
            resValue.value = left.value === right.value;
            break;
        case OPERATOR.GREATER:
            resValue.value = left.value > right.value;
            break;
        case OPERATOR.GREATER_EQUAL:
            resValue.value = left.value >= right.value;
            break;
        case OPERATOR.LESS:
            resValue.value = left.value < right.value;
            break;
        case OPERATOR.LESS_EQUAL:
            resValue.value = left.value <= right.value;
            break;
        case OPERATOR.LOGIC_AND:
            resValue.value = left.value && right.value;
            break;
        case OPERATOR.LOGIC_OR:
            resValue.value = left.value || right.value;
            break;
        case OPERATOR.NOT_EQUAL:
            resValue.value = left.value !== right.value;
            break;
    }
    resValue.type = setValueType(resValue.value);
    console.log(resValue)
    return resValue;
}

function runBinaryExp(binaryExp: BinaryExp) {
    let left: VarTypePair = runExpression(binaryExp.left);
    let right: VarTypePair = runExpression(binaryExp.right);
    console.log("left    ", left, "right    ", right)
    switch (binaryExp.operator.operatorType) {
        case OPERATOR_TYPE.LOGICAL_OPERATOR:
            return handleLogic(left, right, <LogicalOperator>binaryExp.operator.logicOperator);
        case OPERATOR_TYPE.ARITHMETIC_OPERATOR:
            return handleArithmetic(left, right, <ArithmeticOperator>binaryExp.operator.arithmeticOperator);

    }
}

function runUnaryExp(unaryExp: UnaryExp) {
    let operand: VarTypePair | Variable = runExpression(unaryExp.argument);//获取操作数
    if (operand instanceof Variable) {
        //如果是variable，进行转换操作
        operand = wrapToVarTypePair(operand.variableValue, operand.variableType, operand.varName);
    }
    if (unaryExp.operator) {
        //如果存在运算符
        let operator = unaryExp.operator.unaryOperator;
        //使用运算符进行运算操作
        if (operator) {
            if (unaryExp.isPreOperator) {
                //前置运算
                switch (operator) {
                    case OPERATOR.ADD_ONE:
                        operand.value++;
                        break;
                    case OPERATOR.BIT_NOT:
                        operand.value = ~operand.value;
                        break;
                    case OPERATOR.NOT:
                        operand.value = !operand.value;
                        break;
                    case OPERATOR.SUB_ONE:
                        operand.value--;
                        break;
                }
                operand.type = setValueType(operand.value)
            } else {
                //TODO 后置运算，需要运行完当前语句后再执行
            }
            return operand;
        }
    } else {

    }
    return operand;
}

function setValueType(value) {
    //设置运算结果的数据类型
    let valueType;
    switch (typeof value) {
        case "boolean":
            valueType = VARIABLE_TYPE.BOOLEAN;
            break;
        case "number":
            valueType = VARIABLE_TYPE.NUMBER;
            break;
        case "string":
            valueType = VARIABLE_TYPE.STRING;
            break;
        default:
            valueType = VARIABLE_TYPE.NULL;
            break;
    }
    return valueType;
}

function runLiteral(literal: Literal): VarTypePair {
    let value = literal.value;
    return wrapToVarTypePair(value, setValueType(value));
}

function getVariable(varName: string) {
    //先从当前函数的简易符号表中获取
    let fun = curFun();
    let variable: Variable | null = null;
    if (fun) {
        //如果存在函数
        variable = fun.getVariableFromEasySymbolTable(varName);
    }
    if (!variable) {
        variable = symbolTable.getVariable(curModuleName(), varName, curBlock());
    }
    return variable;
}

// @ts-ignore
function runVariableExp(variableExp: VariableExp): Variable {
    let varName = variableExp.varName;
    let variable: Variable;
    variable = <Variable>getVariable(varName);
    if (variable && variable.hasDeclared) {
        return variable;
    } else {
        printFatalError(varName + "变量未定义！");
    }
}
