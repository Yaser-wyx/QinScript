import {QSModule} from "./Module";
import {Fun} from "./Fun";
import {SymbolTable} from "./SymbolTable";
import {kill} from "../Utils/utils";
import {MAIN} from "../Parser/DataStruct/TConstant";
import {printFatalError} from "../error/error";
import {BlockStmt} from "../Parser/DataStruct/ASTNode";

let interpreterInfo: InterpreterInfo;

export class InterpreterInfo {
    private _moduleMap: Map<string, QSModule> = new Map<string, QSModule>();//模块映射表
    protected _curModuleName: string | null = null;//当前模块名
    protected _enter: Fun | null = null;//入口方法
    private _curFun: Fun | null = null;//当前所处方法名
    private _curBlock: BlockStmt | null = null;//当前所处scope的深度

    //添加模块
    putModule(qsModule: QSModule) {
        this._moduleMap.set(qsModule.moduleName, qsModule);
    }

    getModuleByName(moduleName: string): QSModule | null {
        let qsModule = this._moduleMap.get(moduleName);
        if (qsModule) {
            return qsModule
        }
        return null;
    }

    setEnter(enter: Fun) {
        if (this._enter && this._enter.funName === MAIN) {
            printFatalError("main函数只能有一个！");
        }
        this._enter = enter
    }

    get enter(): Fun | null {
        return this._enter;
    }

    setCurModule(moduleName: string) {
        this._curModuleName = moduleName;
    }

    get curModuleName(): string | null {
        return this._curModuleName;
    }

    get moduleMap(): Map<string, QSModule> {
        return this._moduleMap;
    }

    set moduleMap(value: Map<string, QSModule>) {
        this._moduleMap = value;
    }

    get curFun(): Fun | null {
        return this._curFun;
    }

    set curFun(value: Fun | null) {
        this._curFun = value;
    }

    get curBlock(): BlockStmt | null {
        return this._curBlock;
    }

    set curBlock(value: BlockStmt | null) {
        this._curBlock = value;
    }

}


export function getInterpreterInfo(): InterpreterInfo {
    if (!interpreterInfo) {
        interpreterInfo = new InterpreterInfo();
    }

    return interpreterInfo;
}