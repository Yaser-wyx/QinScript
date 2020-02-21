import {Production} from "./Production";
import {hashCode} from "../utils";

export class Closure {
    name: string = "";
    stateNum:number=0;//当前闭包的状态号
    innerSet: Array<Production>;//该闭包包含的产生式
    private _recognizeX: object = {};//一个映射表，表示识别了X后，到达的闭包
    flag: boolean = false;//标记，用于标记该closure是否被处理过
    value: string = "";
    private hash: string = "";//closure的身份证，计算innerSet的值
    addClosureAfterRecognizeX(x: string, closure: Closure) {
        this._recognizeX[x] = closure;
    }

    getClosureAfterRecognizeX(x: string): Closure {
        return this._recognizeX[x];
    }

    resetProductionFlag() {
        this.innerSet.forEach(Production => {
            Production.flag = false;
        })
    }

    get recognizeX(): object {
        return this._recognizeX;
    }

    constructor(innerSet: Array<Production>) {
        this.innerSet = innerSet;
    }

    getHashCode(): string {
        if (this.hash.length === 0) {
            let str = "";
            this.innerSet.forEach((production: Production) => {
                str += production.getValue() + "; ";
            });
            this.value = str;
            this.hash = hashCode(str).toString();
        }
        return this.hash
    }

}