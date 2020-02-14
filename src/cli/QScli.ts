import * as readline from "readline"

export function cli(): Promise<string> {
    //TODO 后期加入其它命令
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => {
        rl.question('请输入要执行的文件路径: ', (path) => {
            resolve(path);
            rl.close();
        })
    })

}


