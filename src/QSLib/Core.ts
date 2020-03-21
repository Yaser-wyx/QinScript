//QS核心库


export function print(args: Array<any>) {
    //todo 需要完善输出流
    let value = "";
    args.forEach(datum => {
        value +=  JSON.stringify(datum);
    });
    console.log(value);
}
