import {FunDeclaration, IDNode} from "../Parser/DataStruct/ASTNode";

//AST中FunDeclaration的包装类
export class Fun {
    private readonly _funDefNode: FunDeclaration;
    private readonly _funName: string;
    private readonly _moduleName: string;//所处模块名
    private readonly _paramList: Array<string> = [];

    constructor(funDefNode: FunDeclaration, moduleName: string) {
        this._funDefNode = funDefNode;
        this._funName = funDefNode.id.name;
        this._moduleName = moduleName;
        funDefNode.params.forEach((id: IDNode) => {
            this._paramList.push(id.name);
        })
    }

    get moduleName(): string {
        return this._moduleName;
    }

    get funDefNode(): FunDeclaration {
        return this._funDefNode;
    }

    get funName(): string {
        return this._funName;
    }

    get paramList(): Array<string> {
        return this._paramList;
    }
}