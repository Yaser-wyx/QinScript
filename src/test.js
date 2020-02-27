function test() {
    let x = 1;
}

let time1 = Date.now();
for (let i = 0; i < 200000000; i++) {
    test()
}
let time2 = Date.now() - time1;
let time3 = Date.now();
for (let i = 0; i < 200000000; i++) {
    let x = 1;
}
let time4 = Date.now() - time3;
console.log("使用函数调用的：", time2);
console.log("不适用函数调用的话：", time4);

console.log("函数调用开销：",(time2-time4))