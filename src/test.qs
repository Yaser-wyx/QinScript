@module:Main;
export:x;
let x = 12;
fun main(){
    let str = "hello,world!";
    print(str);
    print(getSum());
}

fun getSum(){
    let index = 0;
    let sum = 0;
    while(index < 100){
        sum = sum + index;
    }
    return sum;
}
