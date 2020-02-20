//工具包


import * as fs from "fs";
import {printFatalError} from "./error/error";

export async function readFromFile(path: string): Promise<string> {
    //读取文件流
    let codeSource;
    try {
        if (await fs.existsSync(path)) {
            codeSource = await fs.readFileSync(path, "utf8")
        } else {
            printFatalError(`文件：${path}不存在！`);
        }
    } catch (e) {
        printFatalError(e);
    }
    return codeSource;
}

export function kill() {
    //直接杀死进程
    process.exit();
}

export function hashCode(str: string): number {
    let h = 0, off = 0;
    let len = str.length;
    for (let i = 0; i < len; i++) {
        h = (31 * h + str.charCodeAt(off++)) % 4294967296;
    }
    return h % 4294967296;
}
console.log(hashCode("S'->.EE->.aAE->.bB"));