@module:Main;
let res=0;
fun main(){
  let array = [1,2,3,4,5];

}
fun getSum(max){
    if(max == 0){
        return 0;
    }
    return max + getSum(max-1);
}
