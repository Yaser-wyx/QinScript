import {cli} from "./Cli/QScli";
import {GRAMMAR_FILE, TEST_FILE} from "./Cli/config";
import {parseModule} from "./Parser/ParseModule";
import {getInterpreterInfo} from "./Interpreter/InterpreterInfo";
import {runInterpreter} from "./Interpreter";
import {buildLRAnalyzeForm} from "./Parser/AnalyzeGrammar";
import {getParsedModule} from "./Parser/BuildAST";
import {getSymbolTable} from "./Interpreter/SymbolTable";
//运行文件

//TODO 测试阶段，略去读取代码文件的获取，直接对指定文件读取
export async function main() {
    //读取语法文件，并解析出分析表
    let forms = await buildLRAnalyzeForm(GRAMMAR_FILE);
    if (forms) {
        if (await parseModule(TEST_FILE, forms)) {
            //先进行单模块的开发
            let qsModule = getParsedModule();
            let interpreterInfo = getInterpreterInfo();
            interpreterInfo.putModule(qsModule);
            runInterpreter();
        }
    }
}

