//工具包


import * as fs from "fs";
import {printFatalError} from "../error/error";

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

export async function writeToFile(data: any, path: string, needDate: boolean = true) {
    if (needDate) {
        data = "打印时间：" + new Date() + "\n" + data;
    }
    fs.writeFileSync(path, data, 'utf8')
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

let chars = {
    space: '    ',
    pre: '│   ',
    first: '├── ',
    last: '└── '
};

export function createUniqueId(): string {
    return Number(Math.random().toString().substr(2)).toString(36);
}

let toString = function (tree, pre) {
    let string = [], childrenPre = [];
    tree.forEach(function (node, index) {
        let last = index === tree.length - 1;
        //@ts-ignore
        string.push([].concat(pre, last ? chars.last : chars.first, node.name).join(''));
        if (node.children && node.children.length) {
            if (pre.length) {
                childrenPre = pre.concat(last ? chars.space : chars.pre);
            } else {
                //@ts-ignore
                childrenPre = [last ? chars.space : chars.pre];
            }
            string = string.concat(toString(node.children, childrenPre));
        }
    });
    return string;
};

export function tree(tree) {
    let string = [tree.name];
    if (tree.children && tree.children.length) {
        string = string.concat(toString(tree.children, []));
    }
    return string.join('\n');
}
