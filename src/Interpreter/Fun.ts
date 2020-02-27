import {FunDeclaration, IDNode} from "../Parser/DataStruct/AST";

//AST中FunDeclaration的包装类
export class Fun {
    private readonly _funDefNode: FunDeclaration;
    private readonly _funName: string;
    private readonly _paramList: Array<string> = [];

    constructor(funDefNode: FunDeclaration) {
        this._funDefNode = funDefNode;
        this._funName = funDefNode.id.name;
        funDefNode.params.forEach((id: IDNode) => {
            this._paramList.push(id.name);
        })
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