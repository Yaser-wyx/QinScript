export enum NODE_TYPE {
    MODULE,//模块
    ID,//ID
    VAR_DEC_STMT,//变量定义
    VAR_DEF_STMT,//变量声明语句
    RETURN_STMT,//返回语句
    FUN_DECLARATION,//函数定义
    EXPRESSION_STMT,//表达式语句
    IF_STMT,//if语句
    WHILE_STMT,//while语句
    CALL_EXPRESSION,//函数调用表达式
    EXPRESSION,
    ARRAY_EXP,//数组表达式
    OBJECT_EXP,//对象表达式
    PROPERTY,//对象属性
    UNARY_OPERATOR,
    UNARY_EXP,//一元运算符
    BINARY_EXP,//二元运算符
    ASSIGN_EXP,//赋值表达式
    LOGIC_EXP,//逻辑表达式
    MEMBER_EXP,//成员表达式
    LITERAL,//字面量
    BLOCK_STMT,//块语句
}

export enum OPERATOR {
    BIT_NOT,
    NOT,
    ADD,
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
    IDNode
    | Literal
    | FunDeclaration
    | VarDefStmt
    | Statement
    | Expression;

interface ASTNode {
    //抽象语法树节点接口
    readonly nodeType: NODE_TYPE;//节点类型
}

export class FunDeclaration implements ASTNode {

    readonly nodeType: NODE_TYPE = NODE_TYPE.FUN_DECLARATION;
    readonly id: IDNode;
    private _params: Array<IDNode> = [];//形参列表
    body: BlockStatement;

    constructor(id: IDNode, body: BlockStatement) {
        this.id = id;
        this.body = body;
    }

    pushParams(param: IDNode) {
        this._params.push(param);
    }

    get params(): Array<IDNode> {
        return this._params;
    }
}

export class VarDecStmt implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.VAR_DEC_STMT;
    id: IDNode;//要被声明的变量

    constructor(id: IDNode) {
        this.id = id;
    }
}

export class VarDefStmt implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.VAR_DEF_STMT;
    id: IDNode;//要被声明的变量
    init?: Exp | null;//要被初始化的值，默认为null，可以初始化为字面量

    constructor(id: IDNode, init?: Exp) {
        this.id = id;
        this.init = init;
    }
}

export type Statement =
    ExpressionStatement
    | BlockStatement
    | ReturnStmt
    | IfStmt
    | WhileStmt
    | VarDecStmt

export class ReturnStmt implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.RETURN_STMT;
    argument?: Expression | null//返回值
}

export class IfStmt implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.IF_STMT;
    test: Expression;//测试条件
    consequent: Statement;//测试条件成立，则执行
    alternate?: Statement | null;//测试条件不成立，则执行

    constructor(test: Expression, consequent: Statement) {
        this.test = test;
        this.consequent = consequent;
    }
}

export class WhileStmt implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.WHILE_STMT;
    test: Expression;//循环条件
    body: Statement;//循环体语句，可以是单个语句，也可以是语句块

    constructor(test: Expression, body: Statement) {
        this.test = test;
        this.body = body;
    }
}

export class BlockStatement implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.BLOCK_STMT;
    private _body: Array<Statement> = [];

    pushStmt(statement: Statement) {
        this._body.push(statement);
    }

    get body(): Array<Statement> {
        return this._body;
    }
}

export class ExpressionStatement implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.EXPRESSION_STMT;
    expression: Expression;//表达式

    constructor(expression: Expression) {
        this.expression = expression;
    }
}

export type Expression =
    CallExp
    | MemberExp
    | ArrayExp
    | ObjectExp
    | BinaryArithmeticExp
    | UnaryExp
    | AssignExp
    | IDNode
    | Literal
    | BinaryLogicExp


export class Exp implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.EXPRESSION;
    readonly exp: Expression;

    constructor(exp: Expression) {
        this.exp = exp;
    }
}

export class CallExp implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.CALL_EXPRESSION;
    callee: Expression;//被调用对象表达式
    private _args: Array<Expression> = [];//实参列表

    constructor(callee: Expression) {
        this.callee = callee;
    }

    pushArg(arg: Expression) {
        this._args.push(arg);
    }

    get args(): Array<Expression> {
        return this._args;
    }
}

export type MemberExp = ArrayMemberExp | ObjectMemberExp

export class ArrayMemberExp implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.MEMBER_EXP;
    readonly arrayMemberTarget: Expression;//表示目标数组成员
    arraySub: Expression;//数组成员下标表达式

    constructor(arrayMemberTarget: Expression, arraySub: Expression) {
        this.arrayMemberTarget = arrayMemberTarget;
        this.arraySub = arraySub;
    }


}

export class ObjectMemberExp implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.MEMBER_EXP;
    objectMemberTarget: Expression;//表示目标对象成员
    objectSub: Expression;//对象成员下标表达式

    constructor(objectMemberTarget: Expression, objectSub: Expression) {
        this.objectMemberTarget = objectMemberTarget;
        this.objectSub = objectSub;
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

export class IDNode implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.ID;
    readonly name: string;//标识符名
    constructor(name: string) {
        this.name = name;
    }
}


export class AssignExp implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.ASSIGN_EXP;
    left: IDNode | MemberExp;
    right: Expression;

    constructor(left: IDNode | MemberExp, right: Expression) {
        this.left = left;
        this.right = right;
    }
}

export class ObjectExp implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.OBJECT_EXP;
    private _properties: Array<Property> = [];

    pushProperty(property: Property) {
        this._properties.push(property)
    }

    get properties(): Array<Property> {
        return this._properties;
    }
}

export class Property implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.PROPERTY;
    key: string | IDNode;
    value: Expression;

    constructor(key: string | IDNode, value: Expression) {
        this.key = key;
        this.value = value;
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
type UnaryOperator = OPERATOR.BIT_NOT | OPERATOR.NOT;

export class Operator implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.UNARY_OPERATOR;
    operatorType: OPERATOR_TYPE;
    unaryOperator?: UnaryOperator;
    logicOperator?: LogicalOperator;
    arithmeticOperator?: ArithmeticOperator;

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
    operator?: Operator;
    argument: Expression;

    constructor(argument: Expression, operator?: Operator) {
        this.operator = operator;
        this.argument = argument;
    }
}


export class BinaryArithmeticExp implements ASTNode {
    //二元算数运算
    readonly nodeType: NODE_TYPE = NODE_TYPE.BINARY_EXP;
    operator: Operator;
    left: Expression;
    right: Expression;

    constructor(operator: Operator, left: Expression, right: Expression) {
        this.operator = operator;
        this.left = left;
        this.right = right;
    }
}


export class BinaryLogicExp implements ASTNode {
    //二元逻辑运算
    readonly nodeType: NODE_TYPE = NODE_TYPE.LOGIC_EXP;
    operator: Operator;
    left: Expression;
    right: Expression;

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