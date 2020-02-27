//非终结符
export enum V {
    Module,//模块
    ModuleDefine,
    ModuleSelfDefine,//模块名定义
    ModuleImportDefineList,//模块导入列表定义
    ModuleExportList,//模块导出列表定义
    ModuleStmts,
    ModuleExport,//模块导出定义
    ModuleImportDefine,//模块导入定义
    VarDefStmt,
    FunDefStmt,
    ParamList,
    BlockStmt,
    Stmts,
    Stmt,
    VarDecStmt,
    IfStmt,
    WhileStmt,
    CallExp,
    Exps,
    ReturnStmt,
    AssignStmt,
    Exp,
    MemberExp,
    ArraySub,
    ArrayExp,
    ArrayItems,
    ArrayItem,
    ObjectExp,
    Properties,
    Property,
    Key,
    CalExp,
    LogicOperator,
    LogicExp,
    BitOperator,
    BitExp,
    RelationalOperator,
    RelationExp,
    AdditiveOperator,
    AdditiveExp,
    FactorOperator,
    FactorExp,
    UnaryOperator,
    UnaryExp,
    Literal
}

export function getVValue(v: V) {
    return V[v];
}


//终结符
export enum T {
    //数据类型
    NUMBER,//数字
    STRING,//字符串
    ID,//变量名
    //分隔符
    LEFT_PAREN,//左小括号
    RIGHT_PAREN,//右小括号
    LEFT_BRACKET,//左中括号
    RIGHT_BRACKET,//右中括号
    LEFT_BRACE,//左大括号
    RIGHT_BRACE,//右大括号
    COMMA,//逗号
    SEMI,//分号
    DOT,//点
    AT,//@
    COLON,//冒号
    //运算符
    ASSIGN,//等号
    ADD,//加
    SUB,//减
    MUL,//乘
    DIV,//除
    MOD,//取模
    //逻辑运算
    NOT,// !
    LOGIC_OR,// ||
    LOGIN_AND,// &&
    //位运算
    BIT_AND,// &
    BIT_OR,// |
    BIT_NOT,// ~
    //关系运算符
    EQUAL,//==
    NOT_EQUAL,//!=
    GREATER,//>
    GREATER_EQUAL,//>=
    LESS,//<
    LESS_EQUAL,//<=
    //关键字
    LET,
    FUN,
    IMPORT,
    EXPORT,
    MODULE,
    IF,
    ELSE,
    WHILE,
    RETURN,
    TRUE,
    FALSE,
    NULL,
    ERROR,//错误token
    EOF//终结状态
}

export type V_T = T | V;