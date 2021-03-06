/*
 * Copyright (c) 2020. yaser. All rights reserved
 * Description: 解释器
 */
import {cleanInterpreter, getInterpreter, Interpreter} from "./DataStruct/Interpreter";
import {createFunByFunDefStmt, FUN_CLASSES, FUN_TYPE, GeneralFun, InnerFun, StaticFun} from "./DataStruct/Fun";
import {Stack} from "../Parser/DataStruct/Stack";
import {cleanGlobalSymbolTable, getGlobalSymbolTable, GlobalSymbolTable} from "./DataStruct/SymbolTable";
import {printInfo, printInterpreterError} from "../Log";
import {
    ArithmeticOperator,
    ArrayExp,
    AssignStmt,
    BinaryExp,
    BlockStmt,
    CallExp,
    Exp,
    Expression,
    ID_TYPE,
    IDExp,
    IfStmt,
    InnerFunDefStmt,
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
import {getValueType, IDWrap, Variable, VARIABLE_TYPE, VariableMeta} from "./DataStruct/Variable";
import {QSModule} from "./DataStruct/Module";
import {QSFunMap, runLib} from "../QSLib";
import {Reference} from "./DataStruct/Reference";
import {Complexus} from "./DataStruct/Complexus";

let _ = require("lodash");
let runTimeStack = new Stack();//运行时栈
let funRunTimeStack = new Stack<FUN_CLASSES>();//函数运行时栈
let interpreter: Interpreter;
let symbolTable: GlobalSymbolTable;

export function getCurRunningModule() {
    if (interpreter.curModule) {
        return interpreter.curModule.moduleName;
    }
}

/**
 * 测试待获取的id是否可以使用，如果不可使用，则直接退出解释器
 * 可以使用需要满足三个条件
 * 1. 指定模块是否在当前模块中导入
 * 2. 这些变量或函数是否进行了导出
 * 3. 指定模块是否进行了加载
 * @param moduleName
 * @param idName 待获取的id
 */

function testIdIsAvailable(moduleName: string, idName: string) {
    const targetModule = getModuleByName(moduleName);//获取目标模块
    if (curModule().moduleHasImport(moduleName)) {//检查当前模块是否导入目标模块
        if (targetModule.hasExport(idName)) {//检查目标模块是否导出
            if (!targetModule.hasLoad) {
                //如果模块没有加载，则执行加载操作
                loadModule(moduleName);
            }
        } else {
            printInterpreterError(`模块${moduleName}没有导出成员${idName}！`);
        }
    } else {
        printInterpreterError(`模块${moduleName}没有导入！`);
    }
}

/**
 * 统一的变量获取函数
 * @param idWrap 待获取的变量信息
 */
function getVariable(idWrap: IDWrap): Variable | null {
    let variable: Variable | null = null;
    let varName: string = idWrap.idName;//获取变量名
    let moduleName = curModuleName();
    const idModuleName = idWrap.moduleName;
    if (idModuleName === moduleName) {//如果模块名一致
        //从当前函数的符号表中获取
        let fun = curFun();
        if (fun) {
            //如果处于函数内部，则先从函数内获取变量
            if (idWrap.hasAt) {
                //如果有@前缀，说明要获取的是一个静态变量
                if (fun instanceof InnerFun) {
                    //是内部函数
                    variable = fun.getStaticVariable();
                } else {
                    printInterpreterError(`当前函数${fun.funName}不是一个内部函数，只有在内部函数中才可以访问静态变量！`);
                }
            } else {
                //如果当前在函数内，则从函数符号表中获取变量
                variable = fun.getLocalVariable(varName, curBlock());
            }
        }
    } else {
        //如果模块名不同，则需要测试指定模块是否已加载
        moduleName = idModuleName;
        testIdIsAvailable(idModuleName, varName);
    }
    if (!variable) {
        //从全局符号表中获取
        variable = symbolTable.getVariableSymbol(moduleName, varName);
    }
    return variable;
}

//获取普通函数、静态函数与内部函数
function getFun(funIDWrap: IDWrap): FUN_CLASSES | null {
    if (funIDWrap.referenceList.length > 0) {
        //如果引用链的长度大于0，说明调用的是复合体的内部函数
        //先从符号表中获取复合体
        let variable = getVariable(funIDWrap);
        if (variable) {
            //变量存在
            let complexus = variable.getValue();
            if (complexus instanceof Complexus) {
                //是一个复合体变量
                const {brotherComplexus, innerFun} = complexus.getInnerFunAndBotherData(funIDWrap.referenceList);
                if (innerFun instanceof InnerFunDefStmt) {
                    return createFunByFunDefStmt(innerFun, brotherComplexus);
                }
            }
        }
        return null;
    }


    let moduleFun: StaticFun | GeneralFun | null;
    let funModuleName: string = funIDWrap.moduleName;
    const funName = funIDWrap.idName;
    if (funModuleName === curModuleName()) {//与当前模块名一致，也就是说是在当前模块中
        moduleFun = curModule().createModuleFunByFunName(funName);//获取函数AST
    } else {
        //与当前模块名不一致
        testIdIsAvailable(funModuleName, funName);//测试是否可用
        moduleFun = getModuleByName(funModuleName).createModuleFunByFunName(funName);//获取函数AST
    }

    return moduleFun;
}

function pushToStack(value) {
    runTimeStack.push(value);
}

function popFromStack() {
    return runTimeStack.pop();
}

const curBlock = (): BlockStmt => {
    return <BlockStmt>interpreter.curBlock;
};
const curModuleName = (): string => {
    //@ts-ignore
    return interpreter.curModule.moduleName;
};
const curModule = (): QSModule => {
    //@ts-ignore
    return interpreter.curModule
};

const curFun = (): FUN_CLASSES => {
    return <FUN_CLASSES>interpreter.curFun;
};
const curFunType = (): FUN_TYPE => {
    //@ts-ignore
    return interpreter.curFun.funType
}

const wrapToVariableMeta = (valueOrReference: any = null, type: VARIABLE_TYPE = VARIABLE_TYPE.NULL, varName?: string): VariableMeta => {
    return new VariableMeta(type, valueOrReference, varName);
};
const nullValue: VariableMeta = wrapToVariableMeta();

//@ts-ignore
let getModuleByName = (moduleName: string): QSModule => {
    let qsModule = interpreter.getModuleByName(moduleName);
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
    interpreter = getInterpreter();
    symbolTable = getGlobalSymbolTable();
    if (interpreter.enter) {
        let mainFunDefStmt = interpreter.enter;//获取main节点
        const moduleName = mainFunDefStmt.moduleName;
        loadModule(moduleName);//加载指定模块
        switchToModule(moduleName);//切换到main函数所在的module
        createAndPushFun(mainFunDefStmt);//构建main函数
        runFun();//执行main函数
        popAndSetFun();//执行完成，弹出main函数
    } else {
        printInterpreterError("缺少main函数！");
    }
    console.log("\n");
    printInfo("====================代码执行区输出====================", false);
    cleanInterpreter();
    cleanGlobalSymbolTable();
}

//构建函数
function createFun(funDefStmt: ModuleFunDefStmt) {
    return createFunByFunDefStmt(funDefStmt);//构建fun
}

function pushFun(fun: FUN_CLASSES) {
    funRunTimeStack.push(fun);//将fun压栈
    interpreter.curFun = fun;//设置当前fun
}

function createAndPushFun(funDefStmt: ModuleFunDefStmt) {
    pushFun(createFun(funDefStmt));
}

/**
 * 弹出函数，并将下一个函数设置为当前函数（如果存在的话）
 */
function popAndSetFun() {
    //从运行时栈中拿出当前fun，并销毁
    if (!funRunTimeStack.isEmpty()) {
        funRunTimeStack.pop();
        if (!funRunTimeStack.isEmpty()) {
            const fun = funRunTimeStack.peek();
            if (fun && fun.moduleName === curModuleName()) {//如果函数存在，且是当前模块的函数
                interpreter.curFun = fun;//设置当前fun
                return;
            }
        }
    }
    interpreter.curFun = null;//设置为null
}

/**
 * 切换到目标模块，并保存当前上下文环境
 * @param moduleName 目标模块
 */
function switchToModule(moduleName: string) {
    if (curModule()) {//如果当前存在模块
        pushToStack(curModule());//将当前模块压栈
    }
    interpreter.curFun = null;//切换到新的模块后，当前函数应为null，因为函数都保存在函数栈中，所以不需要再次保存
    let nowModule = getModuleByName(moduleName);//获取要切换的module
    interpreter.setCurModule(nowModule);//设置当前module
}

/**
 * 恢复到之前的模块
 */
function recoverModule() {
    let preModule = popFromStack();
    if (preModule instanceof QSModule) {
        interpreter.setCurModule(preModule);//恢复模块
    } else {
        printInterpreterError("运行时错误，模块恢复失败！");
    }
    const fun = funRunTimeStack.peek();
    if (fun && fun.moduleName === curModuleName()) {
        interpreter.curFun = fun;//恢复函数
    }
}

function loadModule(moduleName: string) {
    //加载指定模块，并将所有的模块变量做初始化操作
    const preModule = curModule();
    switchToModule(moduleName);//切换到目标模块
    let nowModule = curModule();
    if (!nowModule.hasLoad) {
        //如果没有加载
        nowModule.moduleVar.forEach(varName => {//对所有模块变量进行逐个初始化操作
            let idWrap = new IDWrap(varName, nowModule.moduleName);
            let variable = getVariable(idWrap);//获取要初始化的模块变量
            if (variable) {
                let initExp = variable.initModuleVar();//将该变量初始化为模块变量
                if (initExp) {
                    variable.setValue(runExpression(initExp));//给模块变量赋值
                }
            } else {
                printInterpreterError(`模块${moduleName}没有${varName}模块变量！`);
            }
        });
        nowModule.hasLoad = true;//将模块标记为加载完成。
    }
    if (preModule) {
        //如果之前的模块存在，则进行恢复，否则不处理
        recoverModule();//加载完成，切换为原来的模块
    }
}

function runFun(): VariableMeta {
    //执行函数，要执行的函数可能有三种，普通函数、静态函数和内部函数
    //读取当前函数的参数
    let nowFun: FUN_CLASSES = curFun();

    let block = nowFun.funBlock;
    if (block) {
        for (let i = 0; i < nowFun.paramList.length; i++) {//读取函数的实参，并添加到函数的符号表下
            let variableMeta = <VariableMeta>popFromStack();
            variableMeta.varName = nowFun.paramList[i];
            //每读取一个实参，就将其保存到符号表中
            nowFun.pushVariable(block, variableMeta);
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
    [NODE_TYPE.INNER_FUN_DEF_STMT]: runInnerFunDefStmt,
    // [NODE_TYPE.VAR_DEF_STMT]: runVarDefStmt,
    [NODE_TYPE.VARIABLE_DEF]: runVariableDefStmt,
    [NODE_TYPE.RETURN_STMT]: runReturnStmt,
    [NODE_TYPE.IF_STMT]: runIfStmt,
    [NODE_TYPE.WHILE_STMT]: runWhileStmt,
    [NODE_TYPE.EXPRESSION_STMT]: runExpression
};

function runStmt(statement: Statement): boolean {
    let runner = statementExecutorMap[statement.nodeType];//获取执行器
    runner(statement);//执行

    if (curFun().hasRearOperator()) {
        //如果有后置运算，则执行
        executeRearOperation()
    }
    if (curFunType() !== FUN_TYPE.STATIC) {
        //如果不是静态函数
        return curFun().returnValue;//返回是否存在返回值
    }
    //如果是静态函数，则永远不返回值
    return false;
}

function runBlockStmt(block: BlockStmt) {
    let body = block.body;
    pushToStack(interpreter.curBlock);//保存当前block
    interpreter.curBlock = block;//切换Block
    for (let index = 0; index < body.length; index++) {
        let statement: Statement = body[index];//获取block中的语句
        if (runStmt(statement)) {
            break;
        }
    }
    let fun = curFun();
    if (fun){
        //如果当前是在函数下，那么需要先将该block下的变量全部清除
        fun.cleanBlockVariable(block);
    }
    interpreter.curBlock = <BlockStmt>popFromStack();//恢复当前block
}

function runAssignStmt(assignStmt: AssignStmt) {
    let leftVariable: VariableMeta = runVariableExp(assignStmt.left);//获取左值
    let rightValue: VariableMeta = runExpression(assignStmt.right);//获取右值

    //判断左值variable是否为对一个变量的引用
    if (leftVariable.type === VARIABLE_TYPE.REFERENCE && leftVariable.reference) {
        //对引用的变量进行赋值
        leftVariable.reference.setReferenceValue(rightValue);
    }
}

function runInnerFunDefStmt(innerFunDefStmt: InnerFunDefStmt) {
    const fun = curFun();

    if (fun instanceof StaticFun) {
        //当前处于静态函数内部
        fun.getComplexus().setInnerFun(innerFunDefStmt);//将静态变量的值添加到复合体上
    } else {
        printInterpreterError("内部函数只可在静态函数内定义！");
    }
}

//定义变量
function runVariableDefStmt(variableDef: VariableDef) {
    const variableMeta = runVarDefStmt(variableDef.VarDefStmt);
    const fun = curFun();
    if (variableDef.isStatic) {
        //如果是静态变量
        if (fun instanceof StaticFun) {
            let variable = new Variable(curModuleName());
            variable.setValue(variableMeta)
            fun.getComplexus().setStaticVar(variable);//将静态变量的值添加到复合体上
        } else {
            printInterpreterError("静态变量只可在静态函数内定义！");
        }
    } else {
        fun.pushVariable(curBlock(), variableMeta);
    }
}

function runVarDefStmt(varDefStmt: VarDefStmt): VariableMeta {
    let varName = varDefStmt.id;
    let initExp = varDefStmt.init;
    let variableMeta: VariableMeta = wrapToVariableMeta(null, VARIABLE_TYPE.NULL, varName);
    if (initExp) {
        //存在初始值
        variableMeta = runExpression(initExp);//可能返回回来的是一个引用
        variableMeta.varName = varName;
    }
    return variableMeta;
}

function runReturnStmt(returnStmt: ReturnStmt) {
    if (returnStmt.argument) {
        curFun().returnValue = _.cloneDeep(runExpression(returnStmt.argument));
    } else {
        curFun().returnValue = wrapToVariableMeta();
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


function runWhileStmt(whileStmt: WhileStmt) {
    let getTestRes = () => {
        let testRes: VariableMeta = runExpression(whileStmt.test);
        return testRes.value
    };
    while (getTestRes()) {
        runStmt(whileStmt.body);
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
function runExpression(exp: Expression): VariableMeta {
    //根据exp的类型执行不同的表达式
    if (exp instanceof Exp) {
        let expExecutor = expressionExecutorMap[exp.exp.nodeType];
        return expExecutor(exp.exp);
    } else {
        let expExecutor = expressionExecutorMap[exp.nodeType];
        return expExecutor(exp);
    }
}

function runCallExp(callExp: CallExp): VariableMeta {
    //构造要调用的函数，并保存该函数到栈中
    let funIDWrap: IDWrap = runIDExp(callExp.callee);
    if (funIDWrap.hasAt) {
        //存在有AT前缀，则是在静态函数里调用内部函数
        if (curFunType() !== FUN_TYPE.INNER) {
            //不在内部函数中
            printInterpreterError("只有在内部函数中，可以使用前缀@来对内部函数进行调用", callExp.lineNo)
        }
    }
    //调用的可能是普通函数，静态函数或内部函数
    let fun: GeneralFun | StaticFun | InnerFun | null = getFun(funIDWrap);//获取并构造fun
    //获取到了函数
    let args: Array<VariableMeta> = [];
    //计算所有实参的值，并转化为值类型的表示法
    callExp.argList.forEach(argExp => {
        args.push(runExpression(argExp));
    });
    if (fun) {
        //如果存在，也就是说不是原生函数
        if (fun.paramList.length === callExp.argList.length) {
            //函数存在，且参数匹配
            let hasSwitch: boolean = false;
            //判断要执行的函数是否在当前模块下，如果是则直接运行，不是则需要切换模块。
            if (fun.moduleName !== curModuleName()) {
                //模块名不同，说明不处于当前模块下，需要切换模块
                hasSwitch = true;
                switchToModule(fun.moduleName);
            }
            while (args.length > 0) {
                pushToStack(args.pop());//将实参从右至左压入栈中，栈顶为最左边的元素
            }
            pushFun(fun);//压入栈
            //调用函数执行，并获取返回结果
            let value = runFun();
            //恢复上下文环境
            popAndSetFun();
            if (hasSwitch) {
                //如果切换过模块，则进行恢复，否则不处理
                recoverModule();//加载完成，切换为原来的模块
            }
            return value;//返回执行结果
        } else {
            printInterpreterError(callExp.callee + "函数在调用时的实参与定义的形参个数不匹配！", callExp.lineNo);
            return nullValue;
        }
    } else {
        //处理原生函数
        let libCall = QSFunMap[funIDWrap.idName];
        if (libCall) {
            //如果是原生函数
            let value = runLib(libCall, args);
            if (value !== undefined) {
                //如果有值
                return wrapToVariableMeta(value, getValueType(value));
            } else {
                return nullValue;
            }
        } else {
            //既不是原生函数也不是自定义函数
            printInterpreterError(callExp.callee + "函数未定义 ", callExp.lineNo);
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
    return wrapToVariableMeta(array, VARIABLE_TYPE.ARRAY)
}

function handleArithmetic(left: VariableMeta, right: VariableMeta, operatorType: ArithmeticOperator): VariableMeta {
    let resValue: VariableMeta = wrapToVariableMeta();//默认为null
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

function handleLogic(left: VariableMeta, right: VariableMeta, operatorType: LogicalOperator): VariableMeta {
    let resValue: VariableMeta = wrapToVariableMeta();//默认为null
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

function runBinaryExp(binaryExp: BinaryExp): VariableMeta {
    let left: VariableMeta = runExpression(binaryExp.left);
    let right: VariableMeta = runExpression(binaryExp.right);
    switch (binaryExp.operator.operatorType) {
        case OPERATOR_TYPE.LOGICAL_OPERATOR:
            return handleLogic(left, right, <LogicalOperator>binaryExp.operator.logicOperator);
        case OPERATOR_TYPE.ARITHMETIC_OPERATOR:
            return handleArithmetic(left, right, <ArithmeticOperator>binaryExp.operator.arithmeticOperator);
        default:
            printInterpreterError(binaryExp.operator + "未定义的运算符！", binaryExp.lineNo);
            return nullValue;
    }
}

function executeRearOperation() {
    //执行后置运算操作
    while (curFun().hasRearOperator()) {
        let variableMeta = curFun().subRearOperator();
        variableMeta.setValueToReference();
    }
}

function addRearOperation(variableMeta: VariableMeta) {
    //添加后置运算
    curFun().addRearOperator(variableMeta);
}

function runUnaryExp(unaryExp: UnaryExp): VariableMeta {
    let operand: VariableMeta = runExpression(unaryExp.argument);//获取操作数
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
                        printInterpreterError("只有变量才能进行自增操作", unaryExp.lineNo);
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
                        printInterpreterError("只有变量才能进行自减操作", unaryExp.lineNo);
                    }
                    break;
            }
            if (operand.type !== VARIABLE_TYPE.REFERENCE) {
                operand.type = getValueType(operand.value);
            }
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


function runLiteral(literal: Literal): VariableMeta {
    let value = literal.value;
    return wrapToVariableMeta(value, getValueType(value));
}


function runIDExp(idExp: IDExp): IDWrap {
    let referenceIndex = new Array<string>();//引用链
    const hasAt = idExp.idType === ID_TYPE.AT_ID;//是否有AT，
    let index = 0;
    let moduleName: string = curModuleName();//变量所处模块名，默认为当前模块
    let varName: string = "";//变量名
    let idArray = idExp.idList;
    if (!hasAt) {
        //如果没有AT，说明不是在内部函数中，访问静态变量
        if (idExp.idType === ID_TYPE.MODULE_ID) {//是否为其它模块的
            //如果是其它模块的，则设置指定的模块名
            moduleName = idArray[index++];//如果为其它模块的，那么id链中第一个为模块名
        }
        varName = idArray[index++];//模块名下一个是变量名
    }
    //对IDExp的结果进行包装处理
    let idWrap: IDWrap = new IDWrap(varName, moduleName, hasAt);
    //从id链中读取剩余的id
    for (; index < idArray.length; index++) {
        referenceIndex.push(idArray[index]);
    }
    idWrap.referenceList = referenceIndex;
    return idWrap;
}

function runVariableExp(variableExp: VariableExp): VariableMeta {
    //解析idExp
    let idExp = variableExp.idExp;
    let varIDWrap: IDWrap = runIDExp(idExp);
    //从符号表中读取variable
    let variable: Variable = <Variable>getVariable(varIDWrap);
    if (variable && variable.hasDeclared) {
        //变量存在，并定义了
        let reference: Reference = new Reference(variable, variable.variableType);//将变量包装为引用
        let idVar: VariableMeta = wrapToVariableMeta(reference, VARIABLE_TYPE.REFERENCE, variable.variableName);//将引用包装成统一的格式进行回传
        //设置引用链
        if (variableExp.arraySub) {
            //如果要获取的是数组变量
            //解析arraySub
            let arraySub: Array<number> = [];
            for (let i = 0; i < variableExp.arraySub.length; i++) {
                let data = runExpression(variableExp.arraySub[i])
                if (data.reference&&data.reference.referencedType===VARIABLE_TYPE.COMPLEXUS){
                    //如果是复合体，则还需要解析
                    arraySub.push(data.reference.getReferenceValue())
                }else{
                    arraySub.push(data.value)
                }
            }
            if (varIDWrap.hasAt) {
                //如果有@前缀，说明访问数组同时还是静态变量
                //@ts-ignore
                idVar.reference.referenceList = _.concat(varIDWrap.referenceList, arraySub);
            } else {
                //@ts-ignore
                idVar.reference.referenceList = arraySub;
            }
        } else {
            //@ts-ignore
            idVar.reference.referenceList = varIDWrap.referenceList
        }
        idVar.resetValue();
        return idVar;
    } else {
        printInterpreterError(varIDWrap.idName + "变量未定义！", variableExp.lineNo);
        return nullValue;
    }
}

