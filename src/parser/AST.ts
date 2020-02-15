export enum NODE_TYPE {
    PROGRAM,//程序
    MODULE,//模块

}

interface ASTNode {
    //抽象语法树节点接口
    value: any;//节点值
    nodeType: NODE_TYPE;//节点类型
}

class Program implements ASTNode {
    //该节点为整个程序的根节点
    nodeType: NODE_TYPE = NODE_TYPE.PROGRAM;
    value: any = null;//根节点没有值
    moduleMap: object = {};//模块映射
    private _nowModule: ModuleNode | null = null;//当前模块
    private _enter: FunNode | null = null;//入口函数，也就是main函数

    pushModuleMap(moduleName: string, moduleAST: ModuleNode) {
        //添加模块映射
        this.moduleMap[moduleName] = moduleAST
    }

    get nowModule(): ModuleNode | null {
        return this._nowModule;
    }

    set nowModule(value: ModuleNode | null) {
        this._nowModule = value;
    }

    get enter(): FunNode | null {
        return this._enter;
    }

    set enter(value: FunNode | null) {
        this._enter = value;
    }
}

class ModuleNode implements ASTNode {
    //模块节点
    nodeType: NODE_TYPE = NODE_TYPE.MODULE;
    value: any = null;//模块名


}

class FunNode implements ASTNode {
    nodeType: NODE_TYPE;
    value: any;

    constructor(nodeType: NODE_TYPE, value: any) {
        this.nodeType = nodeType;
        this.value = value;
    }
}