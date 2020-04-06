import * as readline from "readline"
import * as fs from "fs";
import {printFatalError} from "../Log";
import {parseSingleModule} from "../Parser/ParseModule";
import {GRAMMAR_FILE} from "./config";


export async function readFileList(dir: string): Promise<string[]> {
    //读取文件列表
    let dirList = await fs.readdirSync(dir, "utf8");
    let fileList: string[] = [];
    for (let index = 0; index < dirList.length; index++) {
        if (dirList[index].includes(".qs")) {
            let path = dir + "\\" + dirList[index];
            let stat = await fs.statSync(path);
            if (stat.isDirectory()) {
                let fileDirList = await readFileList(path);
                fileDirList.forEach(value => {
                    fileList.push(value);
                })
            } else {
                fileList.push(path)
            }
        }
    }
    return fileList;
}

export function cli() {
    let version = "QinScript Version 1.0"
    console.log(version);
    console.log("该项目仅供学习使用，请勿用于任何实际项目中，否则后果自负！");
    console.log("-------------------------------------------------");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: 'QS Cli（可输入-help提示）>: '
    });
    rl.prompt();
    rl.on('line', (commands) => {
        let command = commands.split(" ");
        switch (command[0]) {
            case "-help":
                console.log("-version\t版本号\nrun -dir dirPath\t执行项目\nrun -file filePath\t执行文件\nquit\t退出\n-help\t查看命令");
                break;
            case "-version":
                console.log(version);
                break;
            case "run":
                if (command[1] === '-dir' && command.length === 3) {
                    fs.stat(command[2], (err, stat) => {
                        if (err) {
                            console.log("非法的文件路径！");
                        } else {
                            if (stat.isDirectory()) {
                                readFileList(command[2]).then(fileList => {
                                    console.log(fileList);
                                    run(fileList);
                                })
                            } else {
                                console.log("请输入项目文件夹路径！");
                            }
                        }
                    })
                } else if (command[1] === '-file' && command.length === 3) {
                    fs.stat(command[2], (err, stat) => {
                        if (err) {
                            console.log("非法的文件路径！");
                        } else {
                            if (stat.isFile()) {
                                if (command[2].includes(".qs")) {
                                    console.log(command[2]);
                                    run([command[2]])
                                } else {
                                    console.log("要执行的文件必须以.qs结尾！");
                                }
                            } else {
                                console.log("请输入正确的文件路径！");
                            }
                        }
                    })
                } else {
                    console.log(commands + "非法的命令！");
                }
                break;
            case "quit":
                rl.close();
                break;
            default:
                console.log(commands + " 该命令不存在！");
        }
        rl.prompt();
    }).on('close', () => {
        console.log('再见!');
        process.exit(0);
    });


}

async function run(filePathList: Array<string>) {
    for (const filePath of filePathList) {
        // await parseModule(filePath);
    }
}
