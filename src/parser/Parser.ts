//语法分析器，生成抽象语法树
import {getNextToken, hasToken, initLexer} from "../lexer/Lexer";
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
        parserModule();//开始分析模块文法
        return true;
    } else {
        return false;
    }
}
