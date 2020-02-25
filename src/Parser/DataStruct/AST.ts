export enum NODE_TYPE {
    PROGRAM,//程序
    MODULE,//模块
    ID,//ID
    MODULE_DEFINE,
    MODULE_SELF_DEFINE,//模块名定义
    MODULE_IMPORT_DEFINE_LIST,//模块导入列表定义
    MODULE_EXPORT_DEFINE_LIST,//模块导出列表定义
    MODULE_EXPORT_DEFINE,//模块导出定义
    MODULE_IMPORT_DEFINE,//模块导入定义
    VAR_DECLARATION,//变量定义
    VAR_DECLARATOR_STMT,//变量声明语句
    RETURN_STMT,//返回语句
    FUN_DECLARATION,//函数定义
    EXPRESSION_STMT,//表达式语句
    IF_STMT,//if语句
    WHILE_STMT,//while语句
    CALL_EXPRESSION,//函数调用表达式
    ARRAY_EXP,//数组表达式
    OBJECT_EXP,//对象表达式
    PROPERTY,//对象属性
    UNARY_EXP,//一元运算符
    BINARY_EXP,//二元运算符
    ASSIGN_EXP,//赋值表达式
    LOGIC_EXP,//逻辑表达式
    MEMBER_EXP,//成员表达式
    LITERAL,//字面量
    BLOCK_STMT,//块语句
}

export type Node =
    ID
    | Literal
    | Program
    | Module
    | ModuleBodyStatement
    | ModuleDefine
    | FunDeclaration
    | VariableDeclarator
    | Statement
    | Expression;

interface ASTNode {
    //抽象语法树节点接口
    readonly nodeType: NODE_TYPE;//节点类型
}

export class Program implements ASTNode {
    //该节点为整个程序的根节点
    readonly nodeType: NODE_TYPE = NODE_TYPE.PROGRAM;
    private _moduleList: Array<Module> = [];//模块列表
    pushModule(module: Module) {
        this._moduleList.push(module)
    }

    get moduleList(): Array<Module> {
        return this._moduleList;
    }
}


export class Module implements ASTNode {
    //模块节点
    readonly nodeType: NODE_TYPE = NODE_TYPE.MODULE;
    private _moduleDefine: Array<ModuleDefine> = [];//模块定义语句
    private _moduleBody: Array<ModuleBodyStatement> = [];//模块体下是模块语句

    pushBody(child: ModuleBodyStatement) {
        this._moduleBody.push(child);
    }

    pushDefine(define: ModuleDefine) {
        this._moduleDefine.push(define)
    }

    get moduleDefine(): Array<ModuleDefine> {
        return this._moduleDefine;
    }

    get moduleBody(): Array<ModuleBodyStatement> {
        return this._moduleBody;
    }
}

export type ModuleBodyStatement = Declaration
export type Declaration = VarDeclaration | FunDeclaration

export class ModuleDefine implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.MODULE_DEFINE;
    moduleSelfDefine:ModuleSelfDefine;
    moduleImportDefineList?:ModuleImportDefineList;
    moduleExportDefineList?:ModuleExportDefineList;

    constructor(moduleSelfDefine: ModuleSelfDefine) {
        this.moduleSelfDefine = moduleSelfDefine;
    }
}

export class ModuleSelfDefine implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.MODULE_SELF_DEFINE;
    readonly moduleName: string;//当前模块名

    constructor(moduleName: string) {
        this.moduleName = moduleName;
    }
}

export class ModuleExportDefineList implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.MODULE_EXPORT_DEFINE_LIST;
    private _ExportDefineList: Array<ModuleExportDefine> = [];//需要被导出的标识符列表
    pushExportDefine(exportDefine: ModuleExportDefine) {
        this._ExportDefineList.push(exportDefine);
    }

    get ExportDefineList(): Array<ModuleExportDefine> {
        return this._ExportDefineList;
    }
}

export class ModuleExportDefine implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.MODULE_EXPORT_DEFINE;
    ExportedID: ID;//需要被导出的标识符

    constructor(ExportedID: ID) {
        this.ExportedID = ExportedID;
    }
}

export class ModuleImportDefine implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.MODULE_IMPORT_DEFINE;
    importedModule: string;//需要被导入的模块名

    constructor(importedModule: string) {
        this.importedModule = importedModule;
    }
}

export class ModuleImportDefineList implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.MODULE_IMPORT_DEFINE_LIST;
    importModuleList: Array<ModuleImportDefine> = []//需要被导入的模块列表
    pushImportModule(moduleImport: ModuleImportDefine) {
        this.importModuleList.push(moduleImport);
    }
}

export class FunDeclaration implements ASTNode {

    readonly nodeType: NODE_TYPE = NODE_TYPE.FUN_DECLARATION;
    readonly id: ID;
    private _params: Array<ID> = [];//形参列表
    body: BlockStatement;

    constructor(id: ID, body: BlockStatement) {
        this.id = id;
        this.body = body;
    }

    pushParams(param: ID) {
        this._params.push(param);
    }

    get params(): Array<ID> {
        return this._params;
    }
}

export class VarDeclaration implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.VAR_DECLARATION;
    private _declarations: Array<VariableDeclarator> = [];//变量定义子节点列表

    addVarDec(varDec: VariableDeclarator) {
        this._declarations.push(varDec);
    }

    get declarations(): Array<VariableDeclarator> {
        return this._declarations;
    }
}

export class VariableDeclarator implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.VAR_DECLARATOR_STMT;
    id: ID;//要被声明的变量
    init?: Expression | null;//要被初始化的值，默认为null，可以初始化为字面量

    constructor(id: ID) {
        this.id = id;
    }
}

export type Statement =
    ExpressionStatement
    | BlockStatement
    | ReturnStmt
    | IfStmt
    | WhileStmt
    | VarDeclaration

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
    ArrayExp
    | ObjectExp
    | AssignExp
    | CallExp
    | ID
    | MemberExp
    | UnaryExp
    | Literal
    | LogicExp
    | BinaryExp


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

export class ID implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.ID;
    readonly name: string;//标识符名
    constructor(name: string) {
        this.name = name;
    }
}


export class AssignExp implements ASTNode {
    readonly nodeType: NODE_TYPE = NODE_TYPE.ASSIGN_EXP;
    left: ID | MemberExp;
    right: Expression;

    constructor(left: ID | MemberExp, right: Expression) {
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
    key: string | ID;
    value: Expression;

    constructor(key: string | ID, value: Expression) {
        this.key = key;
        this.value = value;
    }
}

export type UnaryOperator =
    "-" | "+" | "!" | "~"

export class UnaryExp implements ASTNode {
    //一元运算表达式
    readonly nodeType: NODE_TYPE = NODE_TYPE.UNARY_EXP;
    operator: UnaryOperator;
    argument: Expression;

    constructor(operator: UnaryOperator, argument: Expression) {
        this.operator = operator;
        this.argument = argument;
    }
}

export type BinaryOperator =
    "==" | "!=" | "<" | "<=" | ">" | ">=" | "+" | "-" | "*" | "/" | "%" | "|" | "&" ;

export class BinaryExp implements ASTNode {
    //二元运算
    readonly nodeType: NODE_TYPE = NODE_TYPE.BINARY_EXP;
    operator: BinaryOperator;
    left: Expression;
    right: Expression;

    constructor(operator: BinaryOperator, left: Expression, right: Expression) {
        this.operator = operator;
        this.left = left;
        this.right = right;
    }
}

export type LogicalOperator = "||" | "&&";

export class LogicExp implements ASTNode {
    //逻辑运算
    readonly nodeType: NODE_TYPE = NODE_TYPE.LOGIC_EXP;
    operator: LogicalOperator;
    left: Expression;
    right: Expression;

    constructor(operator: LogicalOperator, left: Expression, right: Expression) {
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