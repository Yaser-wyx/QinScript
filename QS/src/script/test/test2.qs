@module:Test;
export:res;
export:test;
export:reverseStr;
let res=test("这是Test模块的res");

fun test(str){

    return str;
}

fun reverseStr(str){
    let temp = "";
    let index = len(str)-1;
    while(index>=0){
        temp = temp + str[index--];
    }
    return temp;
}