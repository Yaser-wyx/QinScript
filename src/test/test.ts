import {main} from "../main";
// main();
let array = [1, 2, [3, 4, [5, 6, [7, 8]]]];
let index = [2, 2, 2, 1];
// console.log(array[2][2][2][1])
let now:any = array;
for (let i = 0; i < index.length; i++) {
    now = now[index[i]];
}
console.log(now)