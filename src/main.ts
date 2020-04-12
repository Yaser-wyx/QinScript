/*
 * Copyright (c) 2020. yaser. All rights reserved
 * Description: 主程序
 */
import {cli} from "./Cli/QScli";
import {buildLRAnalyzeForm} from "./Parser/AnalyzeGrammar";
import {GRAMMAR_FILE} from "./Cli/config";
import {printInfo} from "./Log";
export let grammarForms;
buildLRAnalyzeForm(GRAMMAR_FILE).then(res => {
    grammarForms = res;
    printInfo("---------------------------------------------",false)
    cli();
})


