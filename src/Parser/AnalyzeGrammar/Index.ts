import {hashCode, readFromFile, writeToFile} from "../../Utils/utils";
import {CACHE_FILE, HASH_FILE} from "../../Cli/config";
import {ActionForm, GotoForm} from "../DataStruct/Form";
import {analyzeGrammar} from "./BuildActionAndGoTo";
import * as fs from "fs";
import {HashFile} from "../DataStruct/HashFile";
import {printBuildFormError, printInfo, printWarn} from "../../error/error";

export async function buildLRAnalyzeForm(grammarFile: string): Promise<object | null> {
    printInfo("读取语法文件...");
    let grammar = await readFromFile(grammarFile);//读取需要分析的文法
    printInfo("语法文件读取成功！");
    //判断是否存在缓存
    let hashValue = hashCode(grammar);//获取当前语法文件的hash值
    if (await hasCache(hashValue)) {
        printInfo("语法缓存文件读取成功，开始从缓存中重构分析表数据...");
        //如果存在缓存，则读取
        let cache = await readFromFile(CACHE_FILE);
        let cacheData = JSON.parse(cache);
        //从缓存中重建实例对象
        let actionForm = ActionForm.buildActionFromCache(cacheData.actionForm);
        let gotoForm = GotoForm.buildGotoFromCache(cacheData.gotoForm);
        if (actionForm && gotoForm) {
            printInfo("重构分析表数据成功！");
            return {
                actionForm: actionForm,
                gotoForm: gotoForm
            }
        } else {
            printWarn("从缓存中重构分析表数据失败，开始分析语法文件重构分析表！");
        }
    } else {
        printWarn("语法缓存文件已过期或查找失败！");
    }
    await cleanCache();//缓存已失效，清除缓存文件
    //如果不存在缓存，或缓存过期，则重新构建分析表
    let form = analyzeGrammar(grammar);
    printBuildFormError();//打印解析表冲突信息
    if (form) {
        printInfo("语法解析成功！");
        await writeCache(hashValue, form);//写入缓存
    }
    return form;
}


async function writeCache(hashValue: number, cache: any) {
    printInfo("写入语法缓存文件...");
    //写入cache文件，写入grammar的hash值以及cache文件的修改日期hash值
    let cacheData = JSON.stringify(cache);
    //写入缓存
    await writeToFile(cacheData, CACHE_FILE, false);
    let state = await fs.statSync(CACHE_FILE);
    let hashDate = hashCode(state.mtime.toLocaleString());
    let data = new HashFile(hashValue, hashDate);
    await writeToFile(JSON.stringify(data), HASH_FILE, false);
}

async function cleanCache() {
    printInfo("清除语法缓存文件..");
    //清空cache文件
    if (await fs.existsSync(HASH_FILE)) {
        fs.unlinkSync(HASH_FILE);
    }
    if (await fs.existsSync(CACHE_FILE)) {
        fs.unlinkSync(CACHE_FILE);
    }
}

async function hasCache(nowHashValue: number): Promise<boolean> {
    printInfo("检查语法文件的缓存数据...");
    if (await fs.existsSync(HASH_FILE)) {
        //如果存在hash文件，则表示可能存在缓存，接着读取hash文件，查看数值是否正确
        let str = await readFromFile(HASH_FILE);//读取hash文件数据
        let hashFile: HashFile = JSON.parse(str);//
        if (hashFile.hashValue === nowHashValue) {
            //如果hash值正确
            if (await fs.existsSync(CACHE_FILE)) {
                printInfo("语法缓存文件存在，开始读取数据...");
                //如果缓存文件存在
                let state = await fs.statSync(CACHE_FILE);//读取文件状态信息
                let hashDate = hashCode(state.mtime.toLocaleString());
                return hashDate === hashFile.hashDate;
            }
        }
    }
    return false;
}
