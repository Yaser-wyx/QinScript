/*
 * Copyright (c) 2020. yaser. All rights reserved
 * Description: 主程序
 */
import {cli} from "./Cli/QScli";
import {GRAMMAR_FILE, PROJECT_DIR} from "./Cli/config";
import {parseSingleModule} from "./Parser/ParseModule";
import {getInterpreter} from "./Interpreter/DataStruct/Interpreter";
import {buildLRAnalyzeForm} from "./Parser/AnalyzeGrammar";
import {getParsedModule} from "./Parser/BuildAST";
import {runInterpreter} from "./Interpreter";
import {Log, printErr, printInfo} from "./Log";
import {readProject} from "./Project";

//TODO 开发阶段，略去读取代码文件的获取
export async function main() {
    //读取语法文件，并解析出分析表
    let forms = await buildLRAnalyzeForm(GRAMMAR_FILE);
    if (forms) {
        const QSFiles = await readProject(PROJECT_DIR);//读取项目地址
        if (QSFiles) {
            //如果读取列表成功
            //对每一个文件，也就是模块进行解析操作
            printInfo(`当前项目路径下,共识别出${QSFiles.length}个模块文件，开始逐个解析。。。`);
            let interpreterInfo = getInterpreter();//获取解释器信息表
            let flag = true;
            for (let i = 0; i < QSFiles.length; i++) {
                printInfo(`--------开始解析第${i + 1}个模块文件--------`);
                const filePath = QSFiles[i];
                printInfo(`模块路径：${filePath}`);
                if (await parseSingleModule(filePath, forms)) {//解析模块
                    printInfo(`--------第${i + 1}个模块文件语法分析成功！--------`);

                    let qsModule = getParsedModule();//获取模块
                    interpreterInfo.putModule(qsModule);//将解析后的模块加入到解释器信息表中
                } else {
                    flag = false;
                    printErr(`--------第${i + 1}个模块文件语法树构建失败--------`);
                    break;
                }
            }
            if (flag){
                printInfo("所有模块解析完毕！");
                runInterpreter();//执行解释器
            }else{
                printErr("项目解析失败！");
            }
        } else {
            printErr("项目解析失败！");
        }
    } else {
        printErr("语法文件解析失败！");
    }
    printInfo("运行结束！")
}

let version = "QinScript Version 0.11";
printInfo(version, false);
printInfo("该项目仅供学习使用，请勿用于任何实际项目中，否则后果自负！", false);
printInfo("-------------------------------------------------", false);
main();