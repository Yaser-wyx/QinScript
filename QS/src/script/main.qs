@module:Main;

fun main(){
    test(1);
}

static fun test(str){
    static let x = 12;
    print("测试静态函数");

    if(str==0){
      @fun test1(t1){
        print("测试内部函数1");
      }
    }else{
       @fun test2(t2){
         print("测试内部函数2");
       }
    }
}
