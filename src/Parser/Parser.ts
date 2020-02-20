//使用LR分析器，生成抽象语法树
import {getNextToken, hasToken, initLexer} from "../Lexer/Lexer";
import {analyzeGrammar} from "./BuildActionAndGoTo";
import {readFromFile} from "../utils";

export async function buildLRAnalyzeForm(grammarFile: string) {
//构建LR分析表
    let grammar = await readFromFile(grammarFile);//读取需要分析的文法
    analyzeGrammar(grammar);
}

function parserModuleSelfDefine() {


}

function parserModule() {
    while (hasToken()) {
        parserModuleSelfDefine()
    }
}

export async function parser(filePath: string): Promise<boolean> {
    let initSuccess = await initLexer(filePath);//初始化词法分析器
    if (initSuccess) {//是否初始化成功
        await buildLRAnalyzeForm("grammar.txt");//构建分析表
        return true;
    } else {
        return false;
    }
}
