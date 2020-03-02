//AST节点定义
export enum NODE_TYPE {
    MODULE,//模块
    ID,//ID
    VARIABLE_EXP,
    PARAM_LIST,//函数参数列表
    VAR_DEF_STMT,//变量声明语句
    RETURN_STMT,//返回语句
    FUN_DECLARATION,//函数定义
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
    BIT_NOT,
    NOT,
    ADD,
    ADD_ONE,
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

interface ASTNode {
    //抽象语法树节点接口
    readonly nodeType: NODE_TYPE;//节点类型
}

export class FunDeclaration implements ASTNode {

    readonly nodeType: NODE_TYPE = NODE_TYPE.FUN_DECLARATION;
    readonly id: IDNode;
    private readonly _params: ParamList;//形参列表
    readonly body: BlockStmt;

    constructor(id: IDNode, params: ParamList, body: BlockStmt) {
        this.id = id;
        this.body = body;
        this._params = params;
    }

    get params(): Array<IDNode> {
        return this._params.params;
    }
}

export class ParamList implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.PARAM_LIST;
    private _params: Array<IDNode> = [];

    pushParam(id: IDNode) {
        this._params.push(id);
    }

    get params(): Array<IDNode> {
        return this._params;
    }
}

export class VarDefStmt implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.VAR_DEF_STMT;
    readonly id: IDNode;//要被声明的变量
    readonly init?: Exp | null;//要被初始化的值，默认为null，可以初始化为字面量

    constructor(id: IDNode, init?: Exp) {
        this.id = id;
        this.init = init;
    }
}

export type Statement =
    AssignStmt
    | Expression
    | BlockStmt
    | VarDefStmt
    | ReturnStmt
    | IfStmt
    | WhileStmt

export class ReturnStmt implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.RETURN_STMT;
    private readonly _argument: Expression | null = null;//返回值，默认为空

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
    readonly test: Expression;//测试条件
    readonly consequent: Statement;//测试条件成立，则执行
    readonly alternate?: Statement | null;//测试条件不成立，则执行

    constructor(test: Expression, consequent: Statement) {
        this.test = test;
        this.consequent = consequent;
    }
}

export class WhileStmt implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.WHILE_STMT;
    readonly test: Expression;//循环条件
    readonly body: Statement;//循环体语句，可以是单个语句，也可以是语句块

    constructor(test: Expression, body: Statement) {
        this.test = test;
        this.body = body;
    }
}

export class BlockStmt implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.BLOCK_STMT;
    private _body: Array<Statement> = [];
    private readonly _blockID: string;
    private readonly _blockDepth: number;

    constructor(blockID: string, blockDepth: number) {
        this._blockID = blockID;
        this._blockDepth = blockDepth;
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
    | BinaryExp
    | UnaryExp
    | Literal
    | VariableExp
    | Exp


export class Exp implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.EXPRESSION_STMT;
    readonly exp: Expression;

    constructor(exp: Expression) {
        this.exp = exp;
    }
}

export class ArgumentList implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.ARGUMENT_LIST;
    private _args: Array<Expression> = [];

    pushArgs(exp: Expression) {
        this._args.push(exp);
    }

    get args(): Array<Expression> {
        return this._args;
    }
}

export class CallExp implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.CALL_EXPRESSION;
    readonly callee: IDNode;//有两种调用，一种是ID()，另一种是@ID()
    private _args: ArgumentList;//实参列表节点

    constructor(callee: IDNode, argumentList: ArgumentList) {
        this.callee = callee;
        this._args = argumentList;
    }

    get argList(): Array<Expression> {
        return this._args.args;
    }
}


export class ArraySub implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.ARRAY_SUB;
    readonly exp: Exp;
    private _arraySub: Array<Exp> = [];

    constructor(exp: Exp) {
        this.exp = exp;
    }

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

    pushElement(el: Expression) {
        this._elements.push(el);
    }

    get elements(): Array<Expression> {
        return this._elements;
    }
}

export class VariableExp implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.VARIABLE_EXP;
    private readonly isStatic: boolean;
    private readonly id: IDNode;

    constructor(id: IDNode, isStatic: boolean = false) {
        this.isStatic = isStatic;
        this.id = id;
    }
}

export class IDNode implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.ID;
    readonly name: string;//标识符名
    constructor(name: string) {
        this.name = name;
    }
}


export class AssignStmt implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.ASSIGN_STMT;
    readonly left: VariableExp;
    readonly right: Expression;

    constructor(left: VariableExp, right: Expression) {
        this.left = left;
        this.right = right;
    }
}

type ArithmeticOperator =
    OPERATOR.ADD
    | OPERATOR.SUB
    | OPERATOR.MUL
    | OPERATOR.DIV
    | OPERATOR.MOD
    | OPERATOR.BIT_OR
    | OPERATOR.BIT_AND ;

type LogicalOperator =
    OPERATOR.EQUAL
    | OPERATOR.NOT_EQUAL
    | OPERATOR.LESS
    | OPERATOR.LESS_EQUAL
    | OPERATOR.GREATER
    | OPERATOR.GREATER_EQUAL
    | OPERATOR.LOGIC_OR
    | OPERATOR.LOGIC_AND;
type UnaryOperator = OPERATOR.BIT_NOT | OPERATOR.NOT | OPERATOR.ADD_ONE | OPERATOR.SUB_ONE;

export class Operator implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.UNARY_OPERATOR;
    readonly operatorType: OPERATOR_TYPE;
    readonly unaryOperator?: UnaryOperator;
    readonly logicOperator?: LogicalOperator;
    readonly arithmeticOperator?: ArithmeticOperator;

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
    readonly argument: Expression;

    constructor(argument: Expression, operator?: Operator) {
        this._operator = operator;
        this.argument = argument;
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

    constructor(value: string | boolean | number | null) {
        this.value = value;
    }
}