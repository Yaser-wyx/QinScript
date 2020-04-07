@module:Main;
import:Test;

let res = revert("这是Main模块的res");

fun main(){
  print(res);
  print(Test::revert(res));
}
fun revert(str){
    let temp = "";
    let index = len(str)-1;
    while(index>=0){
        temp = temp + str[index--];
    }
    return temp;
}

let a = "测试字符串";
fun bubble_sort(array , length){//冒泡排序
    let i;
    let j;
    let tmp;
    i = length - 1;
    while (i >= 0){
            j = 0;
            while (j < i){
                if (array[j] > array[j + 1]){
                    tmp = array[j];
                    array[j] = array[j + 1];
                    array[j + 1] = tmp;
                }
                j++;
            }
            i --;
        }
        return array;
}
