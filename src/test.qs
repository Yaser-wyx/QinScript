@module:Main;
let res=[44,53,12,1,6,9,12];
fun main(){
  let x = [1,2,3,1,2,2,222222];
  print(res);
  let array = [x, true, [3, "asds", [5, null, [7,bubble_sort(res,7)]]]];
  //let a = array[2][2];
  //a=12;
  print(array);
  print(a);

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
