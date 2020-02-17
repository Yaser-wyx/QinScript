//符号表
export enum SYMBOL_TYPE {
    VARIABLE,//变量符号
    FUNCTION,//函数符号
    NULL//占位
}

export enum VAR_TYPE {
    STRING,
    NUMBER,
    ARRAY,
    OBJECT,
    NULL
}

export class SymbolTable {
    //符号表
    // moduleSymbol:Map<string,SymbolTable>
}

export interface SymbolValue {
    //符号表中单个对象的数据表示
    symbolType: SYMBOL_TYPE;//符号的类型，表示是函数符号还是变量符号
    name: string;
    value: any
}

export class VariableSymbol implements SymbolValue {
    name: string = "";
    readonly symbolType: SYMBOL_TYPE = SYMBOL_TYPE.VARIABLE;
    value: any;
    varType: VAR_TYPE = VAR_TYPE.NULL;
}

export class FunctionSymbol implements SymbolValue {
    name: string = "";
    readonly symbolType: SYMBOL_TYPE = SYMBOL_TYPE.FUNCTION;
    value: any;
    args: symbol[] = [];
}

