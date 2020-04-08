@module:Main;
import:Test;

let res = reverseStr("这是Main模块的res");

fun main(){
  print(res);
  print(Test::reverseStr(res));
}
fun reverseStr(str){
    let temp = "";
    let index = len(str)-1;
    while(index>=0){
        temp = temp + str[index--];
    }
    return temp;
}
