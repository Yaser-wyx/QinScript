//是一个终结符与非终结符的包装类，用于原始Token的规约，以及转化为AST时使用
import {T, V, V_T} from "./V_T";
import {Token} from "../../Lexer/Datastruct/Token";
import {Production} from "./Production";

export class V_T_Wrap {
    isT: boolean = false;//是否是终结符，默认是非终结符
    symbolType: V_T;
    //如果是终结符则有Token，否则没有Token
    token?: Token;
    children: object = {};
    private _childNums:number=0;
    getSymbolValue(isString: boolean = true): string | number {
        if (isString) {
            //需要string类型的值
            if (this.isT && this.token) {
                //如果是终结符
                return this.token.getTokenTypeValue();
            } else {
                //如果是非终结符
                return V[this.symbolType];
            }
        } else {
            //需要number类型的值
            if (this.isT && this.token) {
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
            this.isT = true;
        }
        this.getSymbolValue();
    }

    pushChild(child: V_T_Wrap) {
        this.children[child.getSymbolValue()] = child;
        this._childNums++;
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
