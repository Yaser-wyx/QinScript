//是一个终结符与非终结符的包装类，用于原始Token的规约，以及转化为AST时使用
import {V, V_T} from "./V_T";
import {Token} from "../../Lexer/DataStruct/Token";
import {Production} from "./Production";
import {isArray} from "util";

export class V_T_Wrap {
    private _isT: boolean = false;//是否是终结符，默认是非终结符
    private symbolType: V_T;
    lineNo: number=0;//行号
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

    getChildToken(childName: string): Token | Array<Token> | null {
        //返回匹配成功的Token或Token列表
        if (this.children[childName]) {
            //存在
            if (Array.isArray(this.children[childName])) {
                //如果是数组形式
                let tokenArray: Array<Token> = [];
                let childArray = this.children[childName];
                for (let i = 0; i < childArray.length; i++) {
                    if (childArray[i].token) {
                        tokenArray.push(childArray[i].token)
                    }
                }
                return tokenArray
            } else {
                //普通模式
                if (this.children[childName].token) {
                    return this.children[childName].token
                }
            }
        }
        return null;
    }

    getChildTokenByList(childNameList: Array<string>): Token | Array<Token> | null {
        //list中都是待识别的tokenName
        //返回匹配成功的Token或Token列表
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

    constructor(symbolType: V_T, lineNo?:number,token?: Token) {
        this.symbolType = symbolType;
        if (lineNo != null) {
            this.lineNo = lineNo;
        }
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
            let childName = child.getSymbolValue();
            if (this.children[childName]) {
                //如果已经存在同名的child了，则将该值扩展为数组类型
                if (Array.isArray(this.children[childName])) {
                    //如果该节点已经是数组，则直接加入新的值
                    this.children[childName].push(child);
                } else {
                    //还不是数组对象，将之扩展为数组
                    let childArray: Array<V_T_Wrap> = [];
                    childArray.push(this.children[childName]);
                    childArray.push(child);
                    this.children[childName] = childArray;
                }
            } else {
                //没有同名对象，则使用普通形式
                this.children[childName] = child;
                this._childNums++;
            }
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
        if (!vtWrap.lineNo&&item.lineNo>0){
            vtWrap.lineNo = item.lineNo
        }
    });
    return vtWrap;
}
