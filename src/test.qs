@module:Main;
let res=100;
fun main(){
    let max = res;
    res = 0;
    getSum(max);
    print(res);
}
fun getSum(max){
    while(max>0){
        res = res + max;
        max--;
    }
}
