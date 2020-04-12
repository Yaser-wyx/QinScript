@module:Main;
import:Test;
static fun Stack(len) {
    static let x = array(len,0);
    static let index = 0;
    @fun push(el){
        @x[@index++] = el;
    }
    @fun pop(){
        return @x[@index--];
    }
    @fun getX(){
        //只返回有值的部分
        let res = array(@index);
        let index = 0;
        while(index < @index){
            res[index] = @x[index++];
        }
        return res;
    }
    @fun getSize(){
        return @index;
    }
}

fun main(){
    //测试静态函数、多维数组
    let stack = Stack(100);
    let x= array(100,0);
    x[0]=[1,2,3];
    x[1]=11;
    print(x[0][2],x[1]);
    stack.push("WYX");
    stack.push("LOVE");
    stack.push("QSN");
    let len = 5;
    let index = 0;
    while(index++<len){
        let value = randomInteger(0,100);
        print("随机数：",index,value);
        stack.push(value);
    }
    print(stack.getX());
    //测试多模块
    let str = "abc";
    str = Test::reverseStr(str);
    print(str);
}

