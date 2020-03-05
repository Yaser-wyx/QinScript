import {cli} from "./Cli/QScli";
import {GRAMMAR_FILE, TEST_FILE} from "./Cli/config";
import {parseModule} from "./Parser/ParseModule";
import {getInterpreterInfo} from "./Interpreter/InterpreterInfo";
import {buildLRAnalyzeForm} from "./Parser/AnalyzeGrammar";
import {getParsedModule} from "./Parser/BuildAST";
import {runInterpreter} from "./Interpreter/Interpreter";
import {printErr, printInfo} from "./error/error";

//TODO 测试阶段，略去读取代码文件的获取，直接对指定文件读取
export async function main() {
    //读取语法文件，并解析出分析表
    let forms = await buildLRAnalyzeForm(GRAMMAR_FILE);
    if (forms) {
        if (await parseModule(TEST_FILE, forms)) {//解析模块
            printInfo("语法分析成功！");
            //TODO 目前仅支持单模块
            let qsModule = getParsedModule();//获取模块
            let interpreterInfo = getInterpreterInfo();//获取解释器信息表
            interpreterInfo.putModule(qsModule);//将解析后的模块加入到解释器信息表中
            runInterpreter();//执行解释器
        } else {
            printErr("语法树构建失败")
        }
    } else {
        printErr("语法文件解析失败！");
    }
    printInfo("运行结束！")
}

let version = "QinScript Version 0.1";
printInfo(version, false);
printInfo("该项目仅供学习使用，请勿用于任何实际项目中，否则后果自负！", false);
printInfo("-------------------------------------------------", false);
main();