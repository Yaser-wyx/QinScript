//语法分析测试程序
import {buildLRAnalyzeForm, parser, startAnalyze} from "../Parser/Parser";
import {GRAMMAR_FILE} from "../Cli/config";
import {tree} from "../Utils/utils";
import {SampleNode} from "../Parser/LR1Controller";

startAnalyze(GRAMMAR_FILE);//测试分析表生成
