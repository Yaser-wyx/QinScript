import * as fs from "fs";
import {printErr, printInfo} from "../Log";
import * as path from "path";
import {SUFFIX} from "../Cli/config";

let QSFiles: Array<string> = [];//存储所有的QS文件地址

//读入项目
export async function readProject(projectDir: string): Promise<Array<string>> {
    QSFiles = [];//清空。
    printInfo("开始解析项目路径。。。");
    const projectPath = path.resolve(projectDir);
    await readFiles(projectPath);
    printInfo("项目路径解析完毕。。。");
    return QSFiles;

}

//遍历当前根目录下的文件
async function readFiles(curRoot: string) {
    let fileNameList = fs.readdirSync(curRoot);
    for (let i = 0; i < fileNameList.length; i++) {
        const fileName = fileNameList[i];
        const filePath = path.join(curRoot, fileNameList[i]);
        const fileState = fs.statSync(filePath);
        if (fileState.isFile() && fileName.endsWith(SUFFIX)) {
            //如果是文件，同时是以指定后缀结尾，则加入到文件列表中
            QSFiles.push(filePath);
        } else if (fileState.isDirectory()) {
            //如果是目录，则递归遍历
            await readFiles(filePath);
        }
    }
}