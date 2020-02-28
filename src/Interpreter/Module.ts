//程序中每一个模块的信息
import {Fun} from "./Fun";
import {Variable} from "./Variable";

export class QSModule {
    private _moduleName: string = "";//当前模块名字
    private _importModules: Array<string> = [];//需要导入的模块名字
    private _exportList: Array<string> = [];//需要导出的函数以及变量名
    private importedVarAndFunList: object = {};//导入的方法以及变量列表
    private _funDef: Array<Fun> = [];//方法定义列表
    private _moduleVarDef: Array<Variable> = [];//模块变量列表

    get moduleName(): string {
        return this._moduleName;
    }

    set moduleName(value: string) {
        this._moduleName = value;
    }

    pushFun(funDef: Fun) {
        this._funDef.push(funDef);
    }

    pushModuleVar(varDef: Variable) {
        this._moduleVarDef.push(varDef);
    }


    get funDef(): Array<Fun> {
        return this._funDef;
    }

    get moduleVarDef(): Array<Variable> {
        return this._moduleVarDef;
    }

    pushImport(importModule: string) {
        this._importModules.push(importModule);
    }

    pushExport(exportName: string) {
        this._exportList.push(exportName);
    }

    get importModules(): Array<string> {
        return this._importModules;
    }

    get exportList(): Array<string> {
        return this._exportList;
    }
}