import {QSModule} from "./Module";
import {GeneralFun} from "./Fun";
import {kill} from "../../Utils/utils";
import {MAIN} from "../../Parser/DataStruct/TConstant";
import {printFatalError, printInterpreterError} from "../../Log";
import {BlockStmt, ModuleFunDefStmt} from "../../Parser/DataStruct/ASTNode";

let interpreter: Interpreter;

export class Interpreter {
    private _moduleMap: Map<string, QSModule> = new Map<string, QSModule>();//模块映射表
    protected _curModule: QSModule | null = null;//当前模块
    protected _enter: ModuleFunDefStmt | null = null;//入口方法
    private _curFun: GeneralFun | null = null;//当前所处函数
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

    setEnter(enter: ModuleFunDefStmt) {
        if (this._enter && this._enter.getFunName() === MAIN) {
            printInterpreterError("main函数只能有一个！");
        }
        this._enter = enter
    }

    get enter(): ModuleFunDefStmt | null {
        return this._enter;
    }

    setCurModule(moduleName: QSModule) {
        this._curModule = moduleName;
    }

    get curModule(): QSModule | null {
        return this._curModule;
    }

    get moduleMap(): Map<string, QSModule> {
        return this._moduleMap;
    }

    set moduleMap(value: Map<string, QSModule>) {
        this._moduleMap = value;
    }

    get curFun(): GeneralFun | null {
        return this._curFun;
    }

    set curFun(value: GeneralFun | null) {
        this._curFun = value;
    }

    get curBlock(): BlockStmt | null {
        return this._curBlock;
    }

    set curBlock(value: BlockStmt | null) {
        this._curBlock = value;
    }

}


export function getInterpreter(): Interpreter {
    if (!interpreter) {
        interpreter = new Interpreter();
    }

    return interpreter;
}