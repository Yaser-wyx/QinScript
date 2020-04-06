//程序中每一个模块的信息

import {ModuleFunDefStmt} from "../../Parser/DataStruct/ASTNode";

export class QSModule {
    private _moduleName: string = "";//当前模块名字
    private _importModules: Array<string> = [];//导入的模块名字
    private _exportList: Array<string> = [];//需要导出的函数以及变量名
    private _moduleVar: Array<string> = [];//模块变量名
    private _moduleFun: object = {};//模块函数AST
    private _hasInit:boolean=false;

    get hasInit(): boolean {
        return this._hasInit;
    }

    set hasInit(value: boolean) {
        this._hasInit = value;
    }

    pushModuleVar(varName: string) {
        this._moduleVar.push(varName);
    }

    pushModuleFunDef(funDefStmt: ModuleFunDefStmt) {
        this._moduleFun[funDefStmt.getFunName()] = funDefStmt;
    }

    get moduleVar(): Array<string> {
        return this._moduleVar;
    }

    getModuleFunDefByFunName(funName): ModuleFunDefStmt | null {
        let moduleFunDefStmt: ModuleFunDefStmt = this._moduleFun[funName];
        if (moduleFunDefStmt) {
            return moduleFunDefStmt;
        } else {
            return null;
        }
    }

    get moduleName(): string {
        return this._moduleName;
    }

    set moduleName(value: string) {
        this._moduleName = value;
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