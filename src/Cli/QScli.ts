import * as readline from "readline"
import * as fs from "fs";
import {printErr, printInfo, printWarn} from "../Log";
import {parseSingleModule} from "../Parser/ParseModule";
import {PROJECT_DIR} from "./config";
import {readProject} from "../Project";
import {getInterpreter} from "../Interpreter/DataStruct/Interpreter";
import {getParsedModule} from "../Parser/BuildAST";
import {runInterpreter} from "../Interpreter";
import {grammarForms} from "../main";

export function cli() {
    let version = "QinScript Version  1.0"
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
                printInfo("-version\t版本号\nrun  (projectPath)\t执行指定路径的项目，路径可选，没有则自动执行默认参数\n-quit\t退出\n-help\t查看命令", false);
                rl.prompt();
                break;
            case "-version":
                printInfo(version, false);
                rl.prompt();
                break;
            case "run":
                if (command.length === 1) {
                    readProject(PROJECT_DIR).then(async fileList => {
                        await runProject(fileList);
                        rl.prompt();
                    })
                } else if (command.length === 2) {
                    fs.stat(command[1], async (err, stat) => {
                        if (err) {
                            printErr("非法的文件路径！", false);
                            rl.prompt();
                        } else {
                            if (stat.isDirectory()) {
                                readProject(command[1]).then(async fileList => {
                                    await runProject(fileList);
                                    rl.prompt();
                                })
                            } else {
                                printWarn("非法的项目根目录路径！", false);
                                rl.prompt();
                            }
                        }
                    })
                } else {
                    printErr(commands + " 非法的命令！", false);
                    rl.prompt();
                }
                break;
            case "-quit":
                rl.close();
                break;
            default:
                printErr(commands + " 非法的命令！", false);
                rl.prompt();
        }
    }).on('close', () => {
        printInfo('再见!');
        process.exit(0);
    });
}


async function runProject(filePathList: Array<string>) {
    //读取语法文件，并解析出分析表
    if (grammarForms) {
        //如果读取列表成功
        //对每一个文件，也就是模块进行解析操作
        printInfo(`当前项目路径下,共识别出${filePathList.length}个模块文件，开始逐个解析。。。`);
        let interpreterInfo = getInterpreter();//获取解释器信息表
        let flag = true;
        for (let i = 0; i < filePathList.length; i++) {
            printInfo(`--------开始解析第${i + 1}个模块文件--------`);
            const filePath = filePathList[i];
            printInfo(`模块路径：${filePath}`);
            if (await parseSingleModule(filePath, grammarForms)) {//解析模块
                printInfo(`--------第${i + 1}个模块文件语法分析成功！--------`);
                let qsModule = getParsedModule();//获取模块
                interpreterInfo.putModule(qsModule);//将解析后的模块加入到解释器信息表中
            } else {
                flag = false;
                printErr(`--------第${i + 1}个模块文件语法树构建失败--------`);
                break;
            }
        }
        if (flag) {
            printInfo("所有模块解析完毕！");
            runInterpreter();//执行解释器
        } else {
            printErr("项目解析失败！");
        }
    } else {
        printErr("语法文件解析失败！");
    }
    printInfo("项目运行结束！")
}

