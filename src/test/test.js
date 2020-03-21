let array = [1, 2, [3, 4, [5, 6, [7, 8]]]];
let index = [2, 2, 2, 1];
let value = 110;
let nowArray = array;
// console.log(array[2][2][2][1])
let i = 0;
for (; i < index.length - 1; i++) {
    nowArray = nowArray[index[i]];
}
nowArray[index[i]] = value;
console.log(JSON.stringify(array))
let res=[1,2,3,4];
console.log(null)
