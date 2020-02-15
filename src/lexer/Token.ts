//Token表
export enum TOKEN_TYPE {
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
}

export const EOF = '\0';//文件结束标记，供词法分析器使用

export const keywordTable = {//关键字表
    let: TOKEN_TYPE.LET,
    fun: TOKEN_TYPE.FUN,
    import: TOKEN_TYPE.IMPORT,
    export: TOKEN_TYPE.EXPORT,
    module: TOKEN_TYPE.MODULE,
    if: TOKEN_TYPE.IF,
    else: TOKEN_TYPE.ELSE,
    while: TOKEN_TYPE.WHILE,
    return: TOKEN_TYPE.RETURN,
    true: TOKEN_TYPE.TRUE,
    false: TOKEN_TYPE.FALSE,
    null: TOKEN_TYPE.NULL
};

export class Token {
    tokenType: TOKEN_TYPE;//token的类型
    value: string;//token的值
    start: number;//token在第N行的起始位置
    length: number;//token的长度
    lineNo: number;//token在第几行
    constructor() {
        //初始化token
        this.tokenType = TOKEN_TYPE.NULL;
        this.value = "";
        this.start = 0;
        this.length = 0;
        this.lineNo = 0;
    }
}
