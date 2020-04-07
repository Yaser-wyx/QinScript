//QS核心库


export function print(args: Array<any>) {
    //todo 需要完善输出流
    let value = "";
    const baseType = new Set(['string', 'number', 'boolean']);
    args.forEach(datum => {
        if (baseType.has(typeof datum)) {
            value += datum + " ";
        } else {
            value += JSON.stringify(datum) + " ";
        }
    });
    console.log(value);
}

export function len(arg: Array<any>) {
    return arg[0].length;
}