//是一个终结符与非终结符的包装类，用于原始Token的规约，以及转化为AST时使用
import {V, V_T} from "./V_T";
import {Token} from "../../Lexer/Datastruct/Token";
import {Production} from "./Production";

export class V_T_Wrap {
    private _isT: boolean = false;//是否是终结符，默认是非终结符
    private symbolType: V_T;
    //如果是终结符则有Token，否则没有Token
    token?: Token;
    children: object = {};
    private _isNull: boolean = false;
    private _childNums: number = 0;
    private symbolTypeValue: string;//用于调试


    get isT(): boolean {
        return this._isT;
    }

    get isNull(): boolean {
        return this._isNull;
    }

    testChild(childName: string): boolean {
        //测试孩子是否存在
        return !!this.children[childName];
    }

    getChildToken(childName: string): Token | null {
        if (this.children[childName]) {
            if (this.children[childName].token) {
                return this.children[childName].token
            }
        }
        return null;
    }

    getChildTokenByList(childNameList: Array<string>): Token | null {
        for (let i = 0; i < childNameList.length; i++) {
            let value = this.getChildToken(childNameList[i]);
            if (value) {
                return value;
            }
        }
        return null;
    }

    getSymbolValue(isString: boolean = true): string | number {
        if (isString) {
            //需要string类型的值
            if (this._isT && this.token) {
                //如果是终结符
                return this.token.getTokenTypeValue();
            } else {
                //如果是非终结符
                return V[this.symbolType];
            }
        } else {
            //需要number类型的值
            if (this._isT && this.token) {
                //如果是终结符
                return this.token.tokenType;
            } else {
                //如果是非终结符
                return this.symbolType;
            }
        }
    }

    constructor(symbolType: V_T, token?: Token) {
        this.symbolType = symbolType;
        if (token) {
            //如果是终结符，还需要设置Token
            this.token = token;
            this._isT = true;
        }
        this.symbolTypeValue = <string>this.getSymbolValue();
    }

    pushChild(child: V_T_Wrap) {
        if (child.getSymbolValue() === "NULL") {
            this._isNull = true;
        } else {
            this.children[child.getSymbolValue()] = child;
            this._childNums++;
        }
    }

    get childNums(): number {
        return this._childNums;
    }
}

export function createVTByProduction(production: Production, vtList: Array<V_T_Wrap>) {
    //使用产生式来 创建VTWrap
    let vtWrap = new V_T_Wrap(V[production.key]);
    vtList.forEach(item => {
        vtWrap.pushChild(item);
    });
    return vtWrap;
}
