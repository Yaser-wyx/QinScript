import {hashCode, readFromFile, writeToFile} from "../../Utils/utils";
import {CACHE_FILE, HASH_FILE} from "../../Cli/config";
import {ActionForm, GotoForm} from "../DataStruct/Form";
import {analyzeGrammar} from "./BuildActionAndGoTo";
import * as fs from "fs";
import {HashFile} from "../DataStruct/HashFile";

export async function buildLRAnalyzeForm(grammarFile: string): Promise<object | null> {

    let grammar = await readFromFile(grammarFile);//读取需要分析的文法
    //判断是否存在缓存
    let hashValue = hashCode(grammar);//获取文件的hash值
    if (await hasCache(hashValue)) {
        //如果存在缓存，则读取
        let cache = await readFromFile(CACHE_FILE);
        let cacheData = JSON.parse(cache);
        //从缓存中重建实例对象
        let actionForm = ActionForm.buildActionFromCache(cacheData.actionForm);
        let gotoForm = GotoForm.buildGotoFromCache(cacheData.gotoForm);
        return {
            actionForm: actionForm,
            gotoForm: gotoForm
        }
    }
    let form = analyzeGrammar(grammar);
    if (form) {
        await writeCache(hashValue, form);//写入缓存
    }
    return form;
}


async function writeCache(hashValue: number, cache: any) {
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
    //清空cache文件
    if (await fs.existsSync(HASH_FILE)) {
        fs.unlinkSync(HASH_FILE);
    }
    if (await fs.existsSync(CACHE_FILE)) {
        fs.unlinkSync(CACHE_FILE);
    }
}

async function hasCache(nowHashValue: number): Promise<boolean> {
    if (await fs.existsSync(HASH_FILE)) {
        //如果存在hash文件，则表示可能存在缓存，接着读取hash文件，查看数值是否正确
        let str = await readFromFile(HASH_FILE);
        let hashFile: HashFile = JSON.parse(str);
        if (hashFile.hashValue === nowHashValue) {
            //如果hash值正确
            if (await fs.existsSync(CACHE_FILE)) {
                //如果文件存在
                let state = await fs.statSync(CACHE_FILE);//读取文件状态信息
                let hashDate = hashCode(state.mtime.toLocaleString())
                return hashDate === hashFile.hashDate;
            }
        }
    }
    await cleanCache();
    return false;
}
