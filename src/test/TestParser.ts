//语法分析测试程序
import {buildLRAnalyzeForm, syntaxParser, startAnalyze} from "../Parser/SyntaxParser";
import {GRAMMAR_FILE, TEST_FILE} from "../Cli/config";
import {tree} from "../Utils/utils";

syntaxParser(TEST_FILE,GRAMMAR_FILE);//测试分析表生成
