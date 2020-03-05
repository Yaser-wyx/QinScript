import {getInterpreterInfo, InterpreterInfo} from "./InterpreterInfo";
import {createFunByModuleFunDefStmt, Fun} from "./Fun";
import {Stack} from "../Parser/DataStruct/Stack";
import {getGlobalSymbolTable, GlobalSymbolTable} from "./SymbolTable";
import {printInfo, printInterpreterError} from "../error/error";
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
    ModuleFunDefStmt,
    NODE_TYPE,
    OPERATOR,
    OPERATOR_TYPE,
    ReturnStmt,
    Statement,
    UnaryExp,
    VarDefStmt,
    VariableDef,
    VariableExp,
    WhileStmt
} from "../Parser/DataStruct/ASTNode";
import {Variable, VARIABLE_TYPE, VarTypePair} from "./Variable";
import {QSModule} from "./Module";
import {QSFunMap, runLib} from "../QSLib";

let _ = require("lodash");
let runTimeStack = new Stack();//运行时栈
let funRunTimeStack = new Stack<Fun>();//函数运行时栈
let interpreterInfo: InterpreterInfo;
let symbolTable: GlobalSymbolTable;

//统一的变量获取函数
function getVariable(varName: string) {
    //先从当前函数的符号表中获取
    let fun = curFun();
    let variable: Variable | null = null;
    if (fun) {
        //如果存在函数
        variable = fun.getVariable(varName, curBlock());
    }
    if (!variable) {
        //从函数中获取变量失败，则从全局符号表中获取
        variable = symbolTable.getVariable(curModuleName(), varName);
    }
    return variable;
}

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
    //@ts-ignore
    return interpreterInfo.curModule.moduleName;
};
let curModule = (): QSModule => {
    //@ts-ignore
    return interpreterInfo.curModule
};
let curFun = (): Fun => {
    return <Fun>interpreterInfo.curFun;
};
let wrapToVarTypePair = (value: any = null, type: VARIABLE_TYPE = VARIABLE_TYPE.NULL, varName?: string): VarTypePair => {
    return new VarTypePair(value, type, varName);
};
const nullValue: VarTypePair = wrapToVarTypePair();

//@ts-ignore
let getModuleByName = (moduleName: string): QSModule => {
    let qsModule = interpreterInfo.getModuleByName(moduleName);
    if (qsModule) {
        return qsModule;
    } else {
        printInterpreterError(moduleName + "模块缺失！");
    }
};

export function runInterpreter() {
    printInfo("开始执行！");
    printInfo("====================代码执行区输出====================", false);
    console.log("\n");
    interpreterInfo = getInterpreterInfo();
    symbolTable = getGlobalSymbolTable();
    if (interpreterInfo.enter) {
        let mainFunDefStmt = interpreterInfo.enter;//获取main节点
        switchModule(mainFunDefStmt.moduleName);//切换module
        createAndPushFun(mainFunDefStmt);//将函数压栈
        runFun();//执行
        popAndSetFun();//弹出函数
    } else {
        printInterpreterError("缺少main函数！");
    }
    console.log("\n");
    printInfo("====================代码执行区输出====================", false);
}

function getFun(funName: string) {
    let funDefStmt = curModule().getModuleFunDefByFunName(funName);
    if (funDefStmt) {
        return createFunByModuleFunDefStmt(funDefStmt);
    }
    return null;
}

function getAndPushFun(funName: string) {
    //用函数名获取函数
    let fun = getFun(funName);
    if (fun) {
        pushFun(fun);
        return fun;
    }
    //获取失败
    return null;
}

function createFun(funDefStmt: ModuleFunDefStmt) {
    return createFunByModuleFunDefStmt(funDefStmt);//构建fun
}

function pushFun(fun: Fun) {
    funRunTimeStack.push(fun);//将fun压栈
    interpreterInfo.curFun = fun;//设置当前fun
}

function createAndPushFun(funDefStmt: ModuleFunDefStmt) {
    pushFun(createFun(funDefStmt));
}

function popAndSetFun() {
    //从运行时栈中拿出当前fun，并销毁
    // TODO 对于静态函数不可以直接销毁
    if (!funRunTimeStack.isEmpty()) {
        funRunTimeStack.pop();
        if (!funRunTimeStack.isEmpty()) {
            interpreterInfo.curFun = funRunTimeStack.peek();//设置当前fun
        }
    }
}


function switchModule(moduleName: string) {
    let curModule = getModuleByName(moduleName);//获取要切换的module
    interpreterInfo.setCurModule(curModule);//设置当前module
    if (!curModule.hasInit) {
        //如果没有初始化
        initModule(curModule);//初始化module
    }
}

function initModule(qsModule: QSModule) {
    //初始化模块相关信息，将所有的模块变量做初始化操作
    qsModule.hasInit = true;
    qsModule.moduleVar.forEach(varName => {
        let variable: Variable = <Variable>getVariable(varName);
        if (variable) {
            let initExp = variable.initModuleVar();//初始化模块变量
            if (initExp) {
                variable.setValue(runExpression(initExp));//给模块变量赋值
            }
        } else {
            printInterpreterError(varName + "模块变量缺失！");
        }
    })
}

function runFun(): VarTypePair {
    //执行fun
    //读取当前函数的参数
    let nowFun = curFun();
    let block = nowFun.funBlock;
    if (block) {
        for (let i = 0; i < nowFun.paramList.length; i++) {
            let varTypePair = <VarTypePair>popFromStack();
            varTypePair.varName = nowFun.paramList[i];
            //每读取一个实参，就将其保存到符号表中
            nowFun.pushVariable(block, varTypePair);
        }
        runBlockStmt(block);//执行block中的语句
        //读取返回值
        if (curFun().returnValue) {
            //如果有值，则直接返回
            return curFun().returnValue;
        } else {
            //如果没有值，则包装一个null值
            return nullValue;
        }
    }
    printInterpreterError(nowFun.funName + "函数体缺失！");
    return nullValue;
}

let statementExecutorMap = {
    [NODE_TYPE.ASSIGN_STMT]: runAssignStmt,
    [NODE_TYPE.BLOCK_STMT]: runBlockStmt,
    [NODE_TYPE.VAR_DEF_STMT]: runVarDefStmt,
    [NODE_TYPE.VARIABLE_DEF]: runVariableDef,
    [NODE_TYPE.RETURN_STMT]: runReturnStmt,
    [NODE_TYPE.IF_STMT]: runIfStmt,
    [NODE_TYPE.WHILE_STMT]: runWhileStmt,
    [NODE_TYPE.EXPRESSION_STMT]: runExpression
};

function runBlockStmt(block: BlockStmt) {
    let body = block.body;
    pushToStack(interpreterInfo.curBlock);//保存当前block
    interpreterInfo.curBlock = block;
    for (let index = 0; index < body.length; index++) {
        let statement: Statement = body[index];//获取block中的语句
        let runner = statementExecutorMap[statement.nodeType];//获取执行器
        runner(statement);//执行
        if (curFun().rearOperator) {
            //如果有后置运算，则执行
            executeRearOperation()
        }
        if (curFun().returnValue) {
            //如果有值，后续语句则不执行了
            break;
        }
    }
    interpreterInfo.curBlock = <BlockStmt>popFromStack();//恢复当前block
}

function runAssignStmt(assignStmt: AssignStmt) {
    let variable = runVariableExp(assignStmt.left);//获取要赋值的变量
    let value: VarTypePair = runExpression(assignStmt.right);//获取值
    variable.setValue(value);//赋值
}

function runVariableDef(variableDef: VariableDef) {
    //todo 还可能是静态变量
    curFun().pushVariable(curBlock(), runVarDefStmt(variableDef.VarDefStmt));
}

function runVarDefStmt(varDefStmt: VarDefStmt) {
    let varName = varDefStmt.id;
    let initExp = varDefStmt.init;
    let varTypePair = wrapToVarTypePair(null, VARIABLE_TYPE.NULL, varName);
    if (initExp) {
        //存在初始值
        varTypePair = runExpression(initExp);
        varTypePair.varName = varName;
    }
    return varTypePair;
}

function runReturnStmt(returnStmt: ReturnStmt) {
    if (returnStmt.argument) {
        curFun().returnValue = _.cloneDeep(runExpression(returnStmt.argument));
    } else {
        curFun().returnValue = wrapToVarTypePair();
    }
}

function runIfStmt() {

}

function runWhileStmt(whileStmt: WhileStmt) {
    let getTestRes = () => {
        let testRes: VarTypePair = runExpression(whileStmt.test);
        if (testRes.type === VARIABLE_TYPE.BOOLEAN) {
            return testRes.value
        } else {
            return false;
        }
    };
    while (getTestRes()) {
        statementExecutorMap[whileStmt.body.nodeType](whileStmt.body);
    }
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

function runCallExp(callExp: CallExp): VarTypePair {
    //构造要调用的函数，并保存该函数到栈中
    let funName = callExp.callee;
    let args: Array<VarTypePair> = [];
    //计算所有实参的值，并转化为值类型的表示法
    callExp.argList.forEach(argExp => {
        args.push(runExpression(argExp));
    });
    let libCall = QSFunMap[funName];
    if (libCall) {
        //如果是原生方法
        let value = runLib(libCall, args);
        if (value) {
            //如果有值
            return wrapToVarTypePair(value, getValueType(value));
        } else {
            return nullValue;
        }
    } else {
        //不是原生方法
        let fun: Fun = <Fun>getFun(callExp.callee);
        if (fun) {
            if (fun.paramList.length === callExp.argList.length) {
                //函数存在，且参数匹配
                while (args.length > 0) {
                    pushToStack(args.pop());//将实参从右至左压入栈中，栈顶为最左边的元素
                }
                pushFun(fun);//压入栈
                //调用函数执行，并获取返回结果
                let value = runFun();
                //恢复上下文环境
                popAndSetFun();
                return value;//返回执行结果
            } else {
                printInterpreterError(callExp.callee + "函数在调用时的实参与定义的形参个数不匹配！");
                return nullValue;
            }
        } else {
            printInterpreterError(callExp.callee + "函数未定义 ");
            return nullValue;
        }
    }
}

function runArrayExp() {

}

function handleArithmetic(left: VarTypePair, right: VarTypePair, operatorType: ArithmeticOperator): VarTypePair {
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
        default:
            printInterpreterError(operatorType + "未定义的运算符！")
    }
    resValue.type = getValueType(resValue.value);
    return resValue;
}

function handleLogic(left: VarTypePair, right: VarTypePair, operatorType: LogicalOperator): VarTypePair {
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
        default:
            printInterpreterError(operatorType + "未定义的运算符！")
    }
    resValue.type = getValueType(resValue.value);
    return resValue;
}

function runBinaryExp(binaryExp: BinaryExp): VarTypePair {
    let left: VarTypePair = runExpression(binaryExp.left);
    let right: VarTypePair = runExpression(binaryExp.right);
    switch (binaryExp.operator.operatorType) {
        case OPERATOR_TYPE.LOGICAL_OPERATOR:
            return handleLogic(left, right, <LogicalOperator>binaryExp.operator.logicOperator);
        case OPERATOR_TYPE.ARITHMETIC_OPERATOR:
            return handleArithmetic(left, right, <ArithmeticOperator>binaryExp.operator.arithmeticOperator);
        default:
            printInterpreterError(binaryExp.operator + "未定义的运算符！");
            return nullValue;
    }
}

function executeRearOperation() {
    //执行后置运算操作
    while (curFun().rearOperator) {
        curFun().subRearOperator();
        let varTypePair: VarTypePair = <VarTypePair>popFromStack();
        let variable: Variable = <Variable>popFromStack();
        if (variable && varTypePair) {
            variable.setValue(varTypePair);
        } else {
            printInterpreterError("运行时错误，变量丢失！");
        }
    }
}

function addRearOperation(variable: Variable, varTypePair: VarTypePair) {
    //添加后置运算
    curFun().addRearOperator();
    pushToStack(variable);
    pushToStack(varTypePair);
}

function runUnaryExp(unaryExp: UnaryExp): VarTypePair {
    let operand: VarTypePair | Variable = runExpression(unaryExp.argument);//获取操作数
    let variable: Variable | null = null;
    if (operand instanceof Variable) {
        //如果是variable，进行转换操作
        variable = operand;
        operand = wrapToVarTypePair(operand.variableValue, operand.variableType, operand.varName);
    }
    if (unaryExp.operator) {
        //如果存在运算符
        let operator = unaryExp.operator.unaryOperator;
        let selfOperator = false;//是否是自运算
        //使用运算符进行运算操作
        if (operator) {
            switch (operator) {
                case OPERATOR.ADD_ONE:
                    if (variable) {
                        //只有变量才能进行自增操作
                        selfOperator = true;
                        operand.value++;
                    } else {
                        //报错
                        printInterpreterError("只有变量才能进行自增操作");
                    }
                    break;
                case OPERATOR.BIT_NOT:
                    operand.value = ~operand.value;
                    break;
                case OPERATOR.NOT:
                    operand.value = !operand.value;
                    break;
                case OPERATOR.SUB_ONE:
                    if (variable) {
                        //只有变量才能进行自减操作
                        selfOperator = true;
                        operand.value--;
                    } else {
                        //报错
                        printInterpreterError("只有变量才能进行自减操作");
                    }
                    break;
            }
            operand.type = getValueType(operand.value);
            if (selfOperator && variable) {
                //如果是自运算操作，且运算对象是变量
                if (!unaryExp.isPreOperator) {
                    //后置运算打标记，并将要进行的后置运算加入栈中
                    addRearOperation(variable, _.clone(operand));
                    //恢复值
                    operand.value = variable.variableValue;
                    operand.type = variable.variableType;
                } else {
                    //前置运算，直接赋值
                    variable.setValue(operand);
                }
            }
        }
    }
    return operand;
}

function getValueType(value): VARIABLE_TYPE {
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
    return wrapToVarTypePair(value, getValueType(value));
}


// @ts-ignore
function runVariableExp(variableExp: VariableExp): Variable {
    //获取变量
    let varName = variableExp.varName;
    let variable: Variable;
    variable = <Variable>getVariable(varName);
    if (variable && variable.hasDeclared) {
        //变量存在，并定义了，则返回
        return variable;
    } else {
        printInterpreterError(varName + "变量未定义！");
    }
}
