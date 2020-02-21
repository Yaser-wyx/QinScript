//使用LR分析器，生成抽象语法树
import {getNextToken, hasToken, initLexer} from "../Lexer/Lexer";
import {analyzeGrammar} from "./BuildActionAndGoTo";
import {kill, readFromFile} from "../Utils/utils";
import {FatalError} from "tslint/lib/error";
import {printFatalError} from "../error/error";
import {RunLr1} from "./LR1Controller";

export async function buildLRAnalyzeForm(grammarFile: string): Promise<object | null> {
//构建LR分析表
    let grammar = await readFromFile(grammarFile);//读取需要分析的文法
    return analyzeGrammar(grammar);
}

export async function startAnalyze(grammarFile: string) {
    let forms = await buildLRAnalyzeForm(grammarFile);//构建分析表
    /*if (forms) {
        // @ts-ignore
        RunLr1(forms.actionForm, forms.gotoForm);
    }*/
}

export async function parser(filePath: string, grammarFile: string): Promise<boolean> {
    let initSuccess = await initLexer(filePath);//初始化词法分析器
    if (initSuccess) {//是否初始化成功
        if (grammarFile.length === 0) {
            printFatalError("语法文件不可为空！！！");
        }
        await startAnalyze(grammarFile);
        return true;
    } else {
        return false;
    }
}
