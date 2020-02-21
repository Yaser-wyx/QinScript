import {FunctionSymbol, SymbolValue} from "../Analyzer/SymbolValue";
//测试ts语法
let x:Array<SymbolValue> = [];
let z = new FunctionSymbol();
z.value = "nihao ";
x.push(z);
let c = <FunctionSymbol>x.shift();
console.log(c.value);