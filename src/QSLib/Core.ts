//QS核心库



export function print(args: Array<any>) {
    let value = "";
    args.forEach(datum => {
        value += " " + datum;
    });
    console.log(value)
}
