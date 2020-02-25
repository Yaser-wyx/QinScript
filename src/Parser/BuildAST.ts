import {Stack} from "./DataStruct/Stack";
import {
    ModuleDefine,
    ModuleExportDefineList,
    ModuleImportDefine,
    ModuleImportDefineList,
    ModuleSelfDefine,
    Node,
    NODE_TYPE
} from "./DataStruct/AST";
import {V_T_Wrap} from "./DataStruct/V_T_Wrap";
import {V} from "./DataStruct/V_T";

let ASTStack: Stack<Node> = new Stack<Node>();
let hasImport = false;
//状态树构建方法表
let ASTBuildMap = {
    [V.ModuleSelfDefine]: buildModuleSelfDefine,
    [V.ModuleImportDefine]: buildModuleImportDefine,
    [V.ModuleImportDefineList]: buildModuleImportDefineList
};

export function transferVTToASTNode(vtWrap: V_T_Wrap) {
    //将vtWrap转化为AST上的节点，只用于直接推导，因为此处是构建状态树，所以传来的必定是非终结符
    let call: Function = ASTBuildMap[vtWrap.getSymbolValue(false)]
    if (call) {
        let node: Node = call(vtWrap);
        ASTStack.push(node);
    }

}

//以下为各个非终结符节点的构建方式，同时添加程序的语义
function buildModuleSelfDefine(vtWrap: V_T_Wrap): ModuleSelfDefine {
    //@ts-ignore
    return new ModuleSelfDefine(vtWrap.children.ID.token.value);
}

function buildModuleImportDefine(vtWrap: V_T_Wrap): ModuleImportDefine {
    //@ts-ignore
    return new ModuleImportDefine(vtWrap.children.ID.token.value);
}

function buildModuleImportDefineList(): ModuleImportDefineList {
    let importModule: ModuleImportDefine = <ModuleImportDefine>ASTStack.pop();//从栈中弹出一个要导入的模块
    let moduleImportList: ModuleImportDefineList;
    if (hasImport) {
        //如果已经有导入了
        moduleImportList = <ModuleImportDefineList>ASTStack.pop();
    } else {
        hasImport = true;
        moduleImportList = new ModuleImportDefineList();
    }
    moduleImportList.pushImportModule(importModule);
    return moduleImportList;
}

function buildModuleDefine(vtWrap: V_T_Wrap): ModuleDefine {
    //识别是用哪一种产生式规约的
    let moduleDefine: ModuleDefine;
    if (vtWrap.childNums === 1) {
        moduleDefine = new ModuleDefine(<ModuleSelfDefine>ASTStack.pop());
    } else if (vtWrap.childNums === 2) {
        let moduleImportListOrExportList: Node = ASTStack.pop();
        moduleDefine = new ModuleDefine(<ModuleSelfDefine>ASTStack.pop());
        if (moduleImportListOrExportList.nodeType === NODE_TYPE.MODULE_IMPORT_DEFINE_LIST) {
            moduleDefine.moduleImportDefineList = <ModuleImportDefineList>moduleImportListOrExportList;
        } else {
            moduleDefine.moduleExportDefineList = <ModuleExportDefineList>moduleImportListOrExportList;
        }
    } else {
        let moduleExportList: ModuleExportDefineList = <ModuleExportDefineList>ASTStack.pop();
        let moduleImportList: ModuleImportDefineList = <ModuleImportDefineList>ASTStack.pop();
        moduleDefine = new ModuleDefine(<ModuleSelfDefine>ASTStack.pop());
        moduleDefine.moduleExportDefineList = moduleExportList;
        moduleDefine.moduleImportDefineList = moduleImportList;
    }
    return moduleDefine;
}