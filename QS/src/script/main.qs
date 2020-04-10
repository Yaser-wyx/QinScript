@module:Main;
import:Test;
let x = test("123ads12");
fun main(){
    print(x,len(x));
    x = Test::reverseStr(x);
    print(x);
}

fun test(str){
    print(str);
    return str;
}
/*
static fun test(str){
    print("测试静态函数");

    if(str>0){
      static let x = test(str-1);//静态变量的递归构造
      @fun test1(t1){
        print("测试内部函数1");
      }
    }else{
       @fun test2(t2){
         print("测试内部函数2");
       }
    }
}
*/