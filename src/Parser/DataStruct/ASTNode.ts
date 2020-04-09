//AST节点定义
import exp = require("constants");
import {Stack} from "./Stack";

export enum NODE_TYPE {
    VARIABLE_EXP,
    PARAM_LIST,//函数参数列表
    VARIABLE_DEF,//模块变量，局部变量或静态变量定义语句
    VAR_DEF_STMT,//基础变量声明语句
    RETURN_STMT,//返回语句
    MODULE_FUN_DECLARATION,//模块函数定义
    INNER_FUN_DEF_STMT,//内部函数定义
    FUN_DECLARATION,//基础函数定义
    ID_EXP,//ID表达式
    EXPRESSION_STMT,//表达式语句
    IF_STMT,//if语句
    WHILE_STMT,//while语句
    CALL_EXPRESSION,//函数调用表达式
    ARGUMENT_LIST,//实参列表
    ARRAY_EXP,//数组表达式
    UNARY_OPERATOR,
    UNARY_EXP,//一元运算符
    BINARY_EXP,//二元运算符
    ASSIGN_STMT,//赋值表达式
    ARRAY_SUB,//数组下标
    LITERAL,//字面量
    BLOCK_STMT,//块语句
}

export enum OPERATOR {
    null,
    NOT,
    ADD,
    ADD_ONE,
    BIT_NOT,
    SUB_ONE,
    SUB,
    MOD,
    DIV,
    MUL,
    LESS,
    LESS_EQUAL,
    EQUAL,
    NOT_EQUAL,
    GREATER,
    GREATER_EQUAL,
    BIT_AND,
    BIT_OR,
    LOGIC_OR,
    LOGIC_AND
}

export enum OPERATOR_TYPE {
    UNARY_OPERATOR,//单元运算符
    ARITHMETIC_OPERATOR,//算数运算符
    LOGICAL_OPERATOR,//逻辑运算符
}

export type Node =
    | FunDeclaration
    | ArgumentList
    | ParamList
    | ArraySub
    | Operator
    | Statement;

abstract class ASTNode {
    //抽象语法树节点接口
    abstract readonly nodeType: NODE_TYPE;//节点类型
    abstract lineNo: number;//行号
}

//内部函数的定义节点
export class InnerFunDefStmt implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.INNER_FUN_DEF_STMT;
    lineNo: number = 0;//行号
    private readonly _funDeclaration: FunDeclaration;
    private readonly _moduleName: string;//所属的模块名
    private readonly _staticFunName: string;//所属的静态函数名

    constructor(funDeclaration: FunDeclaration, moduleName: string, staticFunName: string) {
        this._funDeclaration = funDeclaration;
        this._moduleName = moduleName;
        this._staticFunName = staticFunName;
    }

    getFunName() {
        return this._funDeclaration.id;
    }

    get funDeclaration(): FunDeclaration {
        return this._funDeclaration;
    }

    get moduleName(): string {
        return this._moduleName;
    }

    get staticFunName(): string {
        return this._staticFunName;
    }
}

//模块函数的定义节点，区分是静态函数，还是普通函数
export class ModuleFunDefStmt implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.MODULE_FUN_DECLARATION;
    private readonly _isStatic: boolean;
    private readonly _moduleName: string;//所属的模块名
    private readonly _funDeclaration: FunDeclaration;
    lineNo: number = 0;//行号

    constructor(funDeclaration: FunDeclaration, moduleName: string, isStatic: boolean = false) {
        this._moduleName = moduleName;
        this._isStatic = isStatic;
        this._funDeclaration = funDeclaration;
    }

    get moduleName(): string {
        return this._moduleName;
    }

    getFunName() {
        return this._funDeclaration.id;
    }

    get isStatic(): boolean {
        return this._isStatic;
    }

    get funDeclaration(): FunDeclaration {
        return this._funDeclaration;
    }
}

//函数定义节点，不区分是何种函数，可以是静态函数、普通函数或内部函数
export class FunDeclaration implements ASTNode {

    readonly nodeType: NODE_TYPE = NODE_TYPE.FUN_DECLARATION;
    readonly id: string;
    private _params: Array<string> | null = null;//形参列表
    private _body: BlockStmt | null = null;
    lineNo: number = 0;//行号

    constructor(id: string) {
        this.id = id;
    }

    get params(): Array<string> | null {
        if (this._params) {
            return this._params;
        } else {
            return null
        }
    }

    set params(value: Array<string> | null) {
        this._params = value;
    }

    get body(): BlockStmt | null {
        return this._body;
    }

    set body(value: BlockStmt | null) {
        this._body = value;
    }
}

export class ParamList implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.PARAM_LIST;
    private _params: Array<string> = [];
    lineNo: number = 0;//行号

    pushParam(id: string) {
        this._params.push(id);
    }

    get params(): Array<string> {
        return this._params;
    }
}

export class VariableDef implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.VARIABLE_DEF;
    //默认是局部变量
    private _isStatic: boolean;//是否是静态变量
    readonly isModuleVar: boolean;//是否是模块变量
    readonly VarDefStmt: VarDefStmt;//变量定义语句
    lineNo: number = 0;//行号


    constructor(VarDefStmt: VarDefStmt, isModuleVar: boolean = false, isStatic: boolean = false) {
        this._isStatic = isStatic;
        this.isModuleVar = isModuleVar;
        this.VarDefStmt = VarDefStmt;
    }

    get isStatic(): boolean {
        return this._isStatic;
    }

    set isStatic(value: boolean) {
        this._isStatic = value;
    }
}

export class VarDefStmt implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.VAR_DEF_STMT;
    readonly id: string;//要被声明的变量
    readonly init?: Exp | null;//要被初始化的值，默认为null，可以初始化为字面量
    lineNo: number = 0;//行号

    constructor(id: string, init?: Exp) {
        this.id = id;
        this.init = init;
    }
}

export type Statement =
    AssignStmt
    | Expression
    | BlockStmt
    | InnerFunDefStmt
    | VarDefStmt
    | VariableDef
    | ReturnStmt
    | IfStmt
    | WhileStmt

export class ReturnStmt implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.RETURN_STMT;
    private readonly _argument: Expression | null = null;//返回值，默认为空
    lineNo: number = 0;//行号

    get argument(): Expression | null {
        return this._argument;
    }

    constructor(argument?: Expression) {
        if (argument) {
            this._argument = argument;
        }
    }
}

export class IfStmt implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.IF_STMT;
    private readonly _test: Expression;//测试条件
    private readonly _consequent: Statement;//测试条件成立，则执行
    private _alternate: Statement | null = null;//测试条件不成立，则执行
    lineNo: number = 0;//行号

    constructor(test: Expression, consequent: Statement) {
        this._test = test;
        this._consequent = consequent;
    }


    get test(): Expression {
        return this._test;
    }

    get consequent(): Statement {
        return this._consequent;
    }

    get alternate(): Statement | null {
        return this._alternate;
    }

    set alternate(value: Statement | null) {
        this._alternate = value;
    }
}

export class WhileStmt implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.WHILE_STMT;
    readonly test: Expression;//循环条件
    readonly body: Statement;//循环体语句，可以是单个语句，也可以是语句块
    lineNo: number = 0;//行号

    constructor(test: Expression, body: Statement) {
        this.test = test;
        this.body = body;
    }
}

export class BlockStmt implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.BLOCK_STMT;
    private _body: Array<Statement> = [];//block的内容
    private readonly _blockID: string;//当前block的id
    private readonly _blockDepth: number;//当前block的深度
    private readonly _fatherBlock: BlockStmt | null;//父block
    lineNo: number = 0;//行号

    constructor(blockID: string, blockDepth: number, fatherBlock: BlockStmt | null) {
        this._blockID = blockID;
        this._blockDepth = blockDepth;
        this._fatherBlock = fatherBlock;
    }


    get fatherBlock(): BlockStmt | null {
        return this._fatherBlock;
    }

    pushStmt(statement: Statement) {
        this._body.push(statement);
    }

    get body(): Array<Statement> {
        return this._body;
    }

    get blockID(): string {
        return this._blockID;
    }

    get blockDepth(): number {
        return this._blockDepth;
    }
}

export type Expression =
    CallExp
    | ArrayExp
    | IDExp
    | BinaryExp
    | UnaryExp
    | Literal
    | VariableExp
    | Exp


export class Exp implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.EXPRESSION_STMT;
    readonly exp: Expression;
    lineNo: number = 0;//行号

    constructor(exp: Expression) {
        this.exp = exp;
    }
}

export class ArgumentList implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.ARGUMENT_LIST;
    private _args: Array<Expression> = [];
    lineNo: number = 0;//行号

    pushArgs(exp: Expression) {
        this._args.push(exp);
    }

    get args(): Array<Expression> {
        return this._args;
    }
}

export class CallExp implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.CALL_EXPRESSION;
    readonly callee: IDExp;//使用IDExp来代表ID链
    private _args: ArgumentList;//实参列表节点
    lineNo: number = 0;//行号

    constructor(callee: IDExp, argumentList: ArgumentList) {
        this.callee = callee;
        this._args = argumentList;
    }

    get argList(): Array<Expression> {
        return this._args.args;
    }
}

/*export class ArrayMemberExp implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.ARRAY_MEMBER;
    private readonly _variableExp: VariableExp;
    private readonly _arraySub: ArraySub;

    constructor(variableExp: VariableExp, arraySub: ArraySub) {
        this._variableExp = variableExp;
        this._arraySub = arraySub;
    }

    get variableExp(): VariableExp {
        return this._variableExp;
    }

    get arraySub(): ArraySub {
        return this._arraySub;
    }
}*/

export class ArraySub implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.ARRAY_SUB;
    private _arraySub: Array<Exp> = [];
    lineNo: number = 0;//行号

    pushSub(exp: Exp) {
        this._arraySub.push(exp)
    }

    get arraySub(): Array<Exp> {
        return this._arraySub;
    }
}


export class ArrayExp implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.ARRAY_EXP;
    private _elements: Array<Expression> = [];//表示数组元素列表
    lineNo: number = 0;//行号

    pushElement(el: Expression) {
        this._elements.push(el);
    }

    get elements(): Array<Expression> {
        return this._elements;
    }
}

export enum ID_TYPE {
    GENERAL_ID,//普通的id，单个的
    GENERAL_ID_LIST,//普通ID链表
    STATIC_ID,//如果有前缀AT，就代表是静态的ID，根据后缀，可能是静态变量也可能是静态函数
    MODULE_ID//如果有中缀::，就代表是外部模块的变量或函数，那么ID链表中的第一个ID就是模块名，后面的就是相关的ID引用
}

export class IDExp implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.ID_EXP;
    private _idArray: Array<string> = new Array<string>();//ID链
    private _idType: ID_TYPE;
    lineNo: number = 0;//行号

    constructor(idName: string) {
        this._idArray.push(idName);
        this._idType = ID_TYPE.GENERAL_ID
    }

    pushID(idName: string) {
        this._idArray.unshift(idName);
    }


    get idArray(): Array<string> {
        return this._idArray;
    }

    set idType(value: ID_TYPE) {
        //只可以对当前idType为general时才可以设置
        this._idType = value;
    }

    get idType(): ID_TYPE {
        return this._idType;
    }
}

export class VariableExp implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.VARIABLE_EXP;
    private readonly _idExp: IDExp;
    private readonly _arraySub?: Array<Exp>;
    lineNo: number = 0;//行号

    constructor(_varName: IDExp, arraySub?: ArraySub) {
        this._idExp = _varName;
        if (arraySub) {
            this._arraySub = arraySub.arraySub;
        }
    }

    get arraySub(): any {
        return this._arraySub;
    }

    get idExp(): IDExp {
        return this._idExp;
    }
}

export class AssignStmt implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.ASSIGN_STMT;
    readonly left: VariableExp;
    readonly right: Expression;
    lineNo: number = 0;//行号

    constructor(left: VariableExp, right: Expression) {
        this.left = left;
        this.right = right;
    }
}

export type ArithmeticOperator =
    OPERATOR.ADD
    | OPERATOR.SUB
    | OPERATOR.MUL
    | OPERATOR.DIV
    | OPERATOR.MOD
    | OPERATOR.BIT_OR
    | OPERATOR.BIT_AND ;

export type LogicalOperator =
    OPERATOR.EQUAL
    | OPERATOR.NOT_EQUAL
    | OPERATOR.LESS
    | OPERATOR.LESS_EQUAL
    | OPERATOR.GREATER
    | OPERATOR.GREATER_EQUAL
    | OPERATOR.LOGIC_OR
    | OPERATOR.LOGIC_AND;

export type UnaryOperator = OPERATOR.NOT | OPERATOR.ADD_ONE | OPERATOR.SUB_ONE | OPERATOR.BIT_NOT ;

export class Operator implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.UNARY_OPERATOR;
    readonly operatorType: OPERATOR_TYPE;
    readonly unaryOperator?: UnaryOperator;
    readonly logicOperator?: LogicalOperator;
    readonly arithmeticOperator?: ArithmeticOperator;
    lineNo: number = 0;//行号

    constructor(operatorType: OPERATOR_TYPE, operator: OPERATOR) {
        this.operatorType = operatorType;
        switch (operatorType) {
            case OPERATOR_TYPE.ARITHMETIC_OPERATOR:
                this.arithmeticOperator = <ArithmeticOperator>operator;
                break;
            case OPERATOR_TYPE.LOGICAL_OPERATOR:
                this.logicOperator = <LogicalOperator>operator;
                break;
            case OPERATOR_TYPE.UNARY_OPERATOR:
                this.unaryOperator = <UnaryOperator>operator;
                break;
        }
    }
}

export class UnaryExp implements ASTNode {
    //一元运算
    readonly nodeType: NODE_TYPE = NODE_TYPE.UNARY_EXP;
    private _operator?: Operator;
    private _isPreOperator: boolean = false;
    readonly argument: Expression;
    lineNo: number = 0;//行号

    constructor(argument: Expression, operator?: Operator) {
        this._operator = operator;
        this.argument = argument;
    }

    get isPreOperator(): boolean {
        return this._isPreOperator;
    }

    set isPreOperator(value: boolean) {
        this._isPreOperator = value;
    }

    setOperator(operator: Operator) {
        this._operator = operator
    }

    get operator(): Operator | null {
        if (this._operator) {
            return this._operator;
        }
        return null;
    }
}


export class BinaryExp implements ASTNode {
    //二元算数运算
    readonly nodeType: NODE_TYPE = NODE_TYPE.BINARY_EXP;
    readonly operator: Operator;
    readonly left: Expression;
    readonly right: Expression;
    lineNo: number = 0;//行号

    constructor(operator: Operator, left: Expression, right: Expression) {
        this.operator = operator;
        this.left = left;
        this.right = right;
    }
}

export class Literal implements ASTNode {
    //字面量
    readonly nodeType: NODE_TYPE = NODE_TYPE.LITERAL;
    readonly value: string | boolean | number | null;//字面量的值
    lineNo: number = 0;//行号

    constructor(value: string | boolean | number | null) {
        this.value = value;
    }
}