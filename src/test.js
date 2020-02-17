//用于测试一些函数功能是否正常，ts文件无法直接运行
function isID(char) {
    //是否为标识符中间部分
    let string = /[_A-Za-z0-9]/;
    return string.test(char);
}

function isNumber(char) {
    let number = /[0-9.]/;
    return number.test(char);
}

let code = "asdf";

function lookAheadXChar([a, b, c],) {
    //返回向前看的x个字符 return code.substr(3, x);
    console.log(a + b + c);
}

let q = {
    a: lookAheadXChar
}
let t = [1, 2, 3, 4, 5, 6]
let symbolTable = {
    "module1": {
        type: "module",
        moduleSymbolTable:{
            var1:{
                type:"variable",
                value:"",
                varType:Boolean,
                bind:""
            }
        }
    },
    "module2": {
        type: "module",

    },
    "module3": {
        type: "module",

    },
}
/*符号表级别：
    0：模块符号表
    1：模块内函数与全局变量符号表
    2：函数内局部变量符号表
 */