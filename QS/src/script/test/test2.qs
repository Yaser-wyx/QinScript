@module:Test;
export:res;
export:test;
export:reverseStr;
let res=test("这是Test模块的res");

fun test(str){

    return str;
}
let temp = 12;

fun reverseStr(str){
    print(temp);
    let temp = "";
    let index = len(str)-1;
    while(index>=0){
        temp = temp + str[index--];
    }
    return temp;
}