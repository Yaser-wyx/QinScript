import { parseSingleModule} from "../Parser/ParseModule";
import {GRAMMAR_FILE, PROJECT_DIR} from "../Cli/config";
import {tree} from "../Utils/utils";
import {buildLRAnalyzeForm} from "../Parser/AnalyzeGrammar";

// parseModule(TEST_FILE,GRAMMAR_FILE);//测试分析表生成
buildLRAnalyzeForm(GRAMMAR_FILE);