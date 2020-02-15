@module: qsn;
@import: wyx;
let a = "测试字符串";
fun bubble_sort(array , length){//冒泡排序
    let i, j, tmp;
    i = length - 1;
    while (i >= 0){
        j = 0;
        /*
        * 测试多行注释
        */
        while (j < i){
            if (array[j] > array[j + 1]){
                tmp = array[j];
                array[j] = array[j + 1];
                array[j + 1] = tmp;
            }
            j = j + 1;
        }
        i = i - 1;
    }
    return;
}