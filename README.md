# QS解析器设计文档v1

[toc]

## QS语言介绍

- QS全称QingScript，是一门脚本语言，该脚本语言是JavaScript的简化版，主要是为了巩固编译原理的知识而设计的。

## 语法

1.  保留字：

```javascript
import, export, module, fun, let, if, else, while, return, true, false, null
```

2. 标识符：

```
由字母或下划线开头, 后接任意任意个字母或数字或下划线
```

3. 合法符号：

```
( ) [ ] { } , ; = + - / * | & ! < > >= <= == != @ : || && . ~ %
```

4. 注释：

```
注释支持单行 // 与多行注释 /* */ 
```

##  程序结构

- 支持模块，一个文件作为一个模块。

  - 模块定义使用`@module: 模块名`来定义，模块定义必须在第一行。
  - 模块导入使用`@import: 模块名`来导入
  - 模块中对于要导出的方法或变量使用`@export: 导出对象`来定义

- 一个QS项目中必须要有一个main函数（有且只有一个），该函数作为程序入口。
  样例：

  ```
  @module: test
  @import: test1
  let temp;
  fun main(){
  	语句
  }
  @export: 要导出的方法名或变量名
  ```

## 变量

- 变量声明：
  - 变量声明使用`let`关键字来声明，如果声明的时候没有赋值，默认为`null`
- 变量分类：
  - 变量分为两类，一类是模块变量，一类是局部变量。
    - 在模块下直接定义的是模块变量，模块变量支持导出。
    - 在方法内定义的是局部变量，局部变量不支持导出。
- 数据类型：
  - 支持的数据类型与JavaScript一致，number（实数）、string（字符串 ）、bool（布尔）、ObjectExp（对象）以及array（数组）

## 语句

1. 定义语句

```
let ID;（该定义语句同时也是声明语句）
let ID = 表达式;
```

2. if语句

```
if(表达式){
	语句;
}else{
	语句;
}
```

3. while语句

```
while(表达式){
	语句;
}
```

4. 函数定义语句

```
fun ID(形参1, 形参2){
	语句;
}
```

5. 函数调用语句

```
ID(表达式列表);
```

6. return语句

```
return 表达式;
return;
```

7. 赋值语句

```
ID = 表达式;
ID.ID  = 表达式
ID[表达式] = 表达式
```

8. 表达式

```
ID;
1 * 12 + 43 -4;
"11231254231";
[];
{};
函数调用语句;
```

## QS解释器模块介绍

​	QS解释器一共有四个模块，词法分析器、语法分析器以及解释器。

### 词法分析器

​	词法分析器的源码均在[lexer文件夹](src/Lexer)下，主程序是Lexer.ts，词法分析器是手工编码的方式进行实现的。

- Token数据结构：

```typescript
class Token {
    tokenType: TOKEN_TYPE;//token的类型
    ValueExp: string;//token的值
    start: number;//token在第N行的起始位置
    length: number;//token的长度
    lineNo: number;//token在第几行
    constructor() {
        //初始化token
        this.tokenType = TOKEN_TYPE.NULL;
        this.ValueExp = "";
        this.start = 0;
        this.length = 0;
        this.lineNo = 0;
    }
}
```

- Token类型：

```typescript
enum TOKEN_TYPE {
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
    SHIFT_LEFT,// <<
    SHIFT_RIGHT,// >>

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
```

- 词法分析测试程序

```
@module: qsn;
@import: wyx;
let a = "测试字符串";
fun bubble_sort(ArrayExp , length){//冒泡排序
    let i, j, tmp;
    i = length - 1;
    while (i >= 0){
        j = 0;
        /*
        * 测试多行注释
        */
        while (j < i){
            if (ArrayExp[j] > ArrayExp[j + 1]){
                tmp = ArrayExp[j];
                ArrayExp[j] = ArrayExp[j + 1];
                ArrayExp[j + 1] = tmp;
            }
            j = j + 1;
        }
        i = i - 1;
    }
    return;
}
```
- 词法分析结果：见文件[test.out.tokens](src/test.out.tokens)中。
### 语法分析器
 语法分析使用LR(1)分析器进行分析
- 文法规则：
    - 非终结符使用双驼峰命名法。
    - 终结符全大写，并加粗。
    - E代表空字符

<pre>
Program -> ModuleList
<strong>模块文法:</strong>
    Program -> ModuleList | E
    ModuleList -> ModuleList Module | Module
    Module -> ModuleDefine ModuleBody
    ModuleDefine -> ModuleSelfDefine ModuleImportDefineList
    ModuleSelfDefine -> AT MODULE COLON ID SEMI
    ModuleImportDefineList -> ModuleImportDefineList ModuleImportDefine | ModuleImportDefine
    ModuleImportDefine -> AT IMPORT COLON ID SEMI
    ModuleBody -> ModuleStmts
    ModuleStmts -> ModuleStmts ModuleVarDefStmts | ModuleStmts ModuleFunDefStmts  | ModuleStmts ModuleExportList  | E
    ModuleVarDefStmts -> ModuleVarDefStmts VarDefStmt | VarDefStmt
    ModuleFunDefStmts -> ModuleFunDefStmts FunDefStmt | FunDefStmt
    ModuleExportList -> ModuleExportList ModuleExport | ModuleExport
    ModuleExport -> AT EXPORT COLON ID SEMI
    FunDefStmt -> FUN ID LEFT_PAREN ParamList RIGHT_PAREN BlockStmt
    ParamList -> ID | ID COMMA ParamList
    BlockStmt -> LEFT_BRACE Stmts RIGHT_BRACE
    Stmts -> Stmts Stmt | Stmt
    Stmt -> VarDefStmt | IfStmt | WhileStmt | ReturnStmt | BlockStmt | AssignStmt | Exp SEMI
    VarDefStmt -> LET ID ASSIGN ValueExp SEMI | VarDecStmt
    VarDecStmt -> LET ID SEMI
    IfStmt -> IF LEFT_PAREN ValueExp RIGHT_PAREN Stmt | IF LEFT_PAREN ValueExp RIGHT_PAREN Stmt ELSE Stmt
    WhileStmt -> WHILE LEFT_PAREN ValueExp RIGHT_PAREN  Stmt
    CallExp -> Exp LEFT_PAREN Exps RIGHT_PAREN
    Exps -> Exp | Exps COMMA Exp
    ReturnStmt -> RETURN Exp SEMI
    AssignStmt -> ID ASSIGN ValueExp SEMI
    Exp -> ValueExp | E
    ValueExp -> CallExp | MemberExp | ArrayExp | ObjectExp | CalExp
    MemberExp ->  ID DOT MemberExp | ID ArraySub | ID ArraySub DOT MemberExp | ID
    ArraySub -> LEFT_BRACKET ValueExp RIGHT_BRACKET | LEFT_BRACKET ValueExp RIGHT_BRACKET ArraySub
    ArrayExp -> LEFT_BRACKET ArrayItems RIGHT_BRACKET
    ArrayItems -> ArrayItem | ArrayItem COMMA ArrayItems
    ArrayItem -> NUMBER | STRING | ID | ObjectExp | ArrayExp | E
    
    ObjectExp -> LEFT_BRACE Properties RIGHT_BRACE
    Properties -> Properties Property | Property
    Property -> Key COLON ValueExp COMMA
    Key -> STRING | ID
    
    CalExp -> CalExp LogicOperator LogicExp | LogicExp
    LogicOperator -> LOGIC_OR | LOGIN_AND
    LogicExp -> LogicExp BitOperator BitExp | BitExp
    BitOperator -> BIT_AND | BIT_OR
    BitExp -> BitExp RelationalOperator  RelationExp | RelationExp
    RelationalOperator -> LESS | LESS_EQUAL | EQUAL | NOT_EQUAL | GREATER | GREATER_EQUAL
    RelationExp -> RelationExp AdditiveOperator AdditiveExp | AdditiveExp
    AdditiveOperator -> ADD | SUB
    AdditiveExp -> AdditiveExp FactorOperator FactorExp | FactorExp
    FactorOperator -> MOD | DIV | MUL
    FactorExp -> UnaryOperator UnaryExp | UnaryExp
    UnaryOperator -> BIT_NOT | NOT
    UnaryExp -> Literal | ID | LEFT_PAREN ValueExp RIGHT_PAREN
    Literal ->  NUMBER | STRING | TRUE | FALSE | NULL
</pre>

### 解释器
##TODO


