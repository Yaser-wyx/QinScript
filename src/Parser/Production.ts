//用于构建分析表的数据结构
import {hashCode} from "../utils";

export const EOF = "#";
export const E = "$";//表示空字符

export class Production {
    key: string;//对应产生式的左边
    private nowDotAfter: number = 0;//当前原点后面的第一个终结符或非终结符
    private valueWithDot: string = "";//产生式右部含有点的值
    private valueWithOutDot: string = "";//产生式右部不含有点与展望符的值

    private search: string = EOF;//展望信息，默认为EOF
    private _nodeList: Array<string> = new Array<string>();//该产生式的node数组
    private hashWithDot: string = "";//有点的hash值
    private hashWithoutDot: string = "";//没有点的hash值
    flag: boolean = false;

    getHashCode(needDot: boolean = true): string {
        if (needDot) {
            if (this.hashWithDot.length === 0) {
                this.hashWithDot = hashCode(this.getValue(needDot)).toString();
            }
            return this.hashWithDot
        } else {
            if (this.hashWithoutDot.length === 0) {
                this.hashWithoutDot = hashCode(this.getValue(needDot)).toString();
            }
            return this.hashWithoutDot
        }
    }

    setSearch(search: string) {
        this.search = search;
        this.valueWithDot = "";
        this.getValue();
    }

    pushItem(item: string) {
        this._nodeList.push(item);
    }

    get nodeList(): Array<string> {
        return this._nodeList;
    }

    advance(): boolean | string {
        if (this.nowDotAfter < this._nodeList.length) {
            let res = this._nodeList[this.nowDotAfter++];
            this.valueWithDot = "";
            this.getValue();
            return res;
        } else {
            return false;
        }
    }

    getNowDotAfter(): string {
        if (this.nowDotAfter < this._nodeList.length) {
            return this._nodeList[this.nowDotAfter];
        } else {
            return EOF;
        }
    }

    getNodeToCalFirst(): Array<string> {
        //获取需要进行计算first集合的节点
        let nodes = new Array<string>();
        for (let index = this.nowDotAfter + 1; index < this.nodeList.length; index++) {
            nodes.push(this.nodeList[index]);
        }
        nodes.push(this.search);
        return nodes;
    }

    getValue(needDot: boolean = true): string {
        if (needDot) {
            if (this.valueWithDot.length == 0) {
                let value = "[" + this.key + "->";
                //如果值不存在，则遍历链表，获取值
                this._nodeList.forEach((node, index) => {
                    if (index === this.nowDotAfter) {
                        value = value + "." + node;
                    } else {
                        value += node;
                    }
                });
                if (this.nowDotAfter === this._nodeList.length) {
                    value += ".";
                }
                value += ", " + this.search + "]";
                this.valueWithDot = value;
            }
            return this.valueWithDot
        } else {
            if (this.valueWithOutDot.length == 0) {
                let value = this.key + "->";
                //如果值不存在，则遍历链表，获取值
                this._nodeList.forEach((node, index) => {
                    value += node;
                });
                this.valueWithOutDot = value;
            }
            return this.valueWithOutDot
        }
    }

    constructor(key: string) {
        this.key = key;
    }
}