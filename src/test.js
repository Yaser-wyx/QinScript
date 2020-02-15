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

function lookAheadXChar(x) {
    //返回向前看的x个字符 return code.substr(3, x);

}
let index = 0;
while (true){
    index++;
    if (index===1000){
        console.log(index)
        process.exit();
    }
}