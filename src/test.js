let testLow = /[a-z]/g;

let z = new Set();
z.add("a");
z.add("bn");
z.add("af");
z.add("asfg");
z.add("asf");
z.add("af");
console.log(JSON.stringify(Array.from(z)))