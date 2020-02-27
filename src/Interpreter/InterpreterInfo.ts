import {QSModule} from "./Module";
import {Fun} from "./Fun";

let interpreterInfo: InterpreterInfoInner;

export abstract class InterpreterInfo {
    protected moduleMap: Map<string, QSModule> = new Map<string, QSModule>();//模块映射表
    protected _curModuleName: string | null = null;//当前模块名
    protected _enter: Fun | null = null;//入口方法
    protected curFunName: string | null = null;//当前所处方法名
    protected curScopeDepth: number | null = null;//当前所处scope的深度
    protected curScopeID: number | null = null;//当前所处scope的ID
    //TODO 符号表
    //添加模块
    putModule(qsModule: QSModule) {
        this.moduleMap.set(qsModule.moduleName, qsModule);
    }

    getModuleByName(moduleName: string): QSModule | null {
        let qsModule = this.moduleMap.get(moduleName);
        if (qsModule) {
            return qsModule
        }
        return null;
    }

    setEnter(enter: Fun) {
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
}
class InterpreterInfoInner extends InterpreterInfo{
}
export function getInterpreterInfo(): InterpreterInfoInner {
    if (!interpreterInfo) {
        interpreterInfo = new InterpreterInfoInner();
    }
    return interpreterInfo;
}