/*
 * Copyright (c) 2020. yaser. All rights reserved
 * Description: 程序中每一个模块的信息
 */

import {ModuleFunDefStmt} from "../../Parser/DataStruct/ASTNode";
import {IDWrap} from "./Variable";
import {printInterpreterError} from "../../Log";
import {createFunByFunDefStmt, GeneralFun, StaticFun} from "./Fun";

export class QSModule {
    private _moduleName: string = "";//当前模块名字
    private _importModules: Set<string> = new Set<string>();//导入的模块名字
    private _exportSet: Set<string> = new Set<string>();//需要导出的函数名以及变量名
    private _moduleVar: Array<string> = [];//该模块的模块变量名列表，主要用于模块加载的时候遍历并初始化
    private _moduleFun: object = {};//该模块函数的语法树
    private _hasLoad: boolean = false;//默认是不对模块进行初始化操作

    get hasLoad(): boolean {
        return this._hasLoad;
    }

    set hasLoad(value: boolean) {
        this._hasLoad = value;
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

    createModuleFunByFunName(funName): StaticFun | GeneralFun | null {
        let moduleFunDefStmt: ModuleFunDefStmt = this._moduleFun[funName];
        if (moduleFunDefStmt) {
            return createFunByFunDefStmt(moduleFunDefStmt);
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

    pushImportModule(importModule: string) {
        this._importModules.add(importModule);
    }

    pushExport(exportName: string) {
        this._exportSet.add(exportName);
    }

    moduleHasImport(moduleName: string): boolean {
        return this._importModules.has(moduleName);
    }

    hasExport(idName: string): boolean {
        return this._exportSet.has(idName);
    }
}