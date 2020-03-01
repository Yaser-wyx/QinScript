//语法分析测试程序
import { parseModule} from "../Parser/ParseModule";
import {GRAMMAR_FILE, TEST_FILE} from "../Cli/config";
import {tree} from "../Utils/utils";
import {buildLRAnalyzeForm} from "../Parser";

// parseModule(TEST_FILE,GRAMMAR_FILE);//测试分析表生成
buildLRAnalyzeForm(GRAMMAR_FILE);