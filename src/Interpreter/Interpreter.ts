import {getInterpreterInfo, InterpreterInfo} from "./InterpreterInfo";
import {createFunByModuleFunDefStmt, Fun} from "./Fun";
import {Stack} from "../Parser/DataStruct/Stack";
import {getGlobalSymbolTable, GlobalSymbolTable} from "./SymbolTable";
import {printInfo, printInterpreterError} from "../error/error";
import {
    ArithmeticOperator,
    ArrayExp,
    AssignStmt,
    BinaryExp,
    BlockStmt,
    CallExp,
    Exp,
    Expression,
    ID_TYPE, IDExp,
    IfStmt,
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
import {getValueType, IDWrap, Reference, Variable, VARIABLE_TYPE, VarTypePair} from "./Variable";
import {QSModule} from "./Module";
import {QSFunMap, runLib} from "../QSLib";

let _ = require("lodash");
let runTimeStack = new Stack();//运行时栈
let funRunTimeStack = new Stack<Fun>();//函数运行时栈
let interpreterInfo: InterpreterInfo;
let symbolTable: GlobalSymbolTable;

//统一的变量获取函数，根据传入变量名列表以及参数，到具体的符号表中读取变量
//TODO 修改获取方式
function getVariable(idNameOrWrap: string | IDWrap) {
    //先从当前函数的符号表中获取
    let varName: string = <string>idNameOrWrap;
    if (idNameOrWrap instanceof IDWrap) {
        varName = idNameOrWrap.idName;
    }
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

//函数的统一获取
function getFun(funIDWrap: IDWrap) {
    let funDefStmt = curModule().getModuleFunDefByFunName(funIDWrap.idName);
    if (funDefStmt) {
        return createFunByModuleFunDefStmt(funDefStmt);
    }
    return null;
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
let wrapToVarTypePair = (valueOrReference: any = null, type: VARIABLE_TYPE = VARIABLE_TYPE.NULL, varName?: string): VarTypePair => {
    return new VarTypePair(type, valueOrReference, varName);
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
        if (runStmt(statement)) {
            break;
        }
    }
    interpreterInfo.curBlock = <BlockStmt>popFromStack();//恢复当前block
}

function runAssignStmt(assignStmt: AssignStmt) {
    let leftVariable: VarTypePair = runVariableExp(assignStmt.left);//获取左值
    let rightValue: VarTypePair = runExpression(assignStmt.right);//获取右值

    //判断左值variable是否为对一个变量的引用
    if (leftVariable.type === VARIABLE_TYPE.REFERENCE && leftVariable.reference) {
        //对引用的变量进行赋值
        leftVariable.reference.setReferenceValue(rightValue);
    }
}

function runVariableDef(variableDef: VariableDef) {
    //todo 还可能是静态变量
    curFun().pushVariable(curBlock(), runVarDefStmt(variableDef.VarDefStmt));
}

function runVarDefStmt(varDefStmt: VarDefStmt) {
    let varName = varDefStmt.id;
    let initExp = varDefStmt.init;
    let varTypePair: VarTypePair = wrapToVarTypePair(null, VARIABLE_TYPE.NULL, varName);
    if (initExp) {
        //存在初始值
        varTypePair = runExpression(initExp);//可能返回回来的是一个引用
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

function runIfStmt(ifStmt: IfStmt) {
    //读取测试条件
    let testVal = runExpression(ifStmt.test);//获取结果值
    let statement;//要执行的语句
    if (testVal.value) {
        statement = ifStmt.consequent;
    } else {
        statement = ifStmt.alternate;//可能为null
    }
    if (statement) {
        runStmt(statement)
    }
}

function runStmt(statement: Statement): boolean {
    let runner = statementExecutorMap[statement.nodeType];//获取执行器
    runner(statement);//执行

    if (curFun().rearOperator) {
        //如果有后置运算，则执行
        executeRearOperation()
    }
    return curFun().returnValue;//返回是否存在返回值
}

function runWhileStmt(whileStmt: WhileStmt) {
    let getTestRes = () => {
        let testRes: VarTypePair = runExpression(whileStmt.test);
        return testRes.value
    };
    while (getTestRes()) {
        runStmt(whileStmt.body);
    }
}

let expressionExecutorMap = {
    [NODE_TYPE.CALL_EXPRESSION]: runCallExp,
    [NODE_TYPE.ARRAY_EXP]: runArrayExp,
    // TODO [NODE_TYPE.ARRAY_MEMBER]: runArrayMemberExp,
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
    let funIDWrap: IDWrap = runIDExp(callExp.callee);
    let fun: Fun = <Fun>getFun(funIDWrap);//获取并构造fun
    let args: Array<VarTypePair> = [];
    //计算所有实参的值，并转化为值类型的表示法
    callExp.argList.forEach(argExp => {
        args.push(runExpression(argExp));
    });
    if (fun) {
        //如果存在，也就是说不是原生函数
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
        //处理原生函数
        let libCall = QSFunMap[funIDWrap.idName];
        if (libCall) {
            //如果是原生函数
            let value = runLib(libCall, args);
            if (value) {
                //如果有值
                return wrapToVarTypePair(value, getValueType(value));
            } else {
                return nullValue;
            }
        } else {
            //既不是原生函数也不是自定义函数
            printInterpreterError(callExp.callee + "函数未定义 ");
            return nullValue;
        }
    }
}

function runArrayExp(arrayExp: ArrayExp) {
    //计算array里的数值内容
    let array: Array<any> = [];
    for (let i = arrayExp.elements.length - 1; i >= 0; i--) {
        array.push(runExpression(arrayExp.elements[i]).value)
    }
    return wrapToVarTypePair(array, VARIABLE_TYPE.ARRAY)
}

function handleArithmetic(left: VarTypePair, right: VarTypePair, operatorType: ArithmeticOperator): VarTypePair {
    let resValue: VarTypePair = wrapToVarTypePair();//默认为null
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
    let resValue: VarTypePair = wrapToVarTypePair();//默认为null
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
        if (varTypePair) {
            varTypePair.setValueToReference();
        } else {
            printInterpreterError("运行时错误，变量丢失！");
        }
    }
}

function addRearOperation(varTypePair: VarTypePair) {
    //添加后置运算
    curFun().addRearOperator();
    pushToStack(varTypePair);
}

function runUnaryExp(unaryExp: UnaryExp): VarTypePair {
    let operand: VarTypePair = runExpression(unaryExp.argument);//获取操作数
    let referencedVar: Variable | null = null;//被引用的变量
    if (operand.reference) {
        referencedVar = operand.reference.referencedVar
    }
    if (unaryExp.operator) {
        //如果存在运算符
        let operator = unaryExp.operator.unaryOperator;
        let selfOperator = false;//是否是自运算
        //使用运算符进行运算操作
        if (operator) {
            switch (operator) {
                case OPERATOR.ADD_ONE:
                    if (referencedVar) {
                        //只有是对变量的引用才能进行自增操作
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
                    if (operand.reference) {
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
            if (selfOperator && referencedVar) {
                //如果是自运算操作，且运算对象是变量
                if (!unaryExp.isPreOperator) {
                    //后置运算打标记，并将要进行的后置运算加入栈中
                    addRearOperation(_.clone(operand));
                    //恢复值
                    operand.value = referencedVar.getValue();
                    operand.type = referencedVar.variableType;
                } else {
                    //前置运算，直接赋值
                    operand.setValueToReference()
                }
            }
        }
    }
    return operand;
}


function runLiteral(literal: Literal): VarTypePair {
    let value = literal.value;
    return wrapToVarTypePair(value, getValueType(value));
}


function runIDExp(idExp: IDExp): IDWrap {
    let referenceIndex = new Array<string>();//复合体的引用链表
    let isStatic = idExp.idType === ID_TYPE.STATIC_ID;
    let isModule = idExp.idType === ID_TYPE.MODULE_ID;
    let varName: string;//变量名
    let moduleName: string | undefined = undefined;//变量所处模块名，不为空的前提是引用的是其它模块的变量
    let idArray = idExp.idArray;
    let index = 0;
    if (isModule) {
        //如果是模块变量，则设置模块名
        moduleName = idArray[index++];
        varName = idArray[index++];
    } else {
        //如果不是模块变量，则只需要设置varName
        varName = idArray[index++];
    }
    //对IDExp的结果进行包装处理
    let idWrap: IDWrap = new IDWrap(varName, isStatic, isModule, moduleName);
    //从id链中读取剩余的id
    for (; index < idArray.length; index++) {
        referenceIndex.push(idArray[index]);
    }
    idWrap.referenceIndex = referenceIndex;
    return idWrap;
}


function runVariableExp(variableExp: VariableExp): VarTypePair {
    //解析idExp
    let idExp = variableExp.idExp;
    let varIDWrap: IDWrap = runIDExp(idExp);
    //从符号表中读取variable
    let variable: Variable = <Variable>getVariable(varIDWrap);

    if (variable && variable.hasDeclared) {
        //变量存在，并定义了
        let reference: Reference = new Reference(variable, variable.variableType);//将变量包装为引用
        let idVar: VarTypePair = wrapToVarTypePair(reference, VARIABLE_TYPE.REFERENCE, variable.variableName);//将引用包装成统一的格式进行回传
        if (idVar.reference) {
            //设置引用链
            if (variableExp.arraySub) {
                //如果要获取的是数组变量
                //解析arraySub
                let arraySub: Array<number> = [];
                for (let i = 0; i < variableExp.arraySub.length; i++) {
                    //@ts-ignore
                    arraySub.push(runExpression(variableExp.arraySub[i]).value)
                }
                idVar.reference.referenceIndex = arraySub;
            } else if (varIDWrap.referenceIndex.length > 0) {
                //如果要获取的是一个复合体
                idVar.reference.referenceIndex = varIDWrap.referenceIndex
            }
        } else {
            printInterpreterError("运行时错误，变量引用丢失！")
        }
        idVar.resetValue();
        return idVar;
    } else {
        printInterpreterError(varIDWrap.idName + "变量未定义！");
        return nullValue;
    }
}
