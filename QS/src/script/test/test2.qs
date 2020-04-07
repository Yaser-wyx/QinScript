@module:Test;
export:res;
export:getLen;
export:revert;
let res=getLen("这是Test模块的res");

fun test(str){
    print(str);
    return res1;
}
fun getLen(str){
    return len(str);
}

fun revert(str){
    let temp = "";
    let index = len(str)-1;
    while(index>=0){
        temp = temp + str[index--];
    }
    return temp;
}