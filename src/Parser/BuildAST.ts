import {Stack} from "./DataStruct/Stack";
import {Node} from "./DataStruct/AST";
import {V_T_Wrap} from "./DataStruct/V_T_Wrap";

let ASTStack: Stack<Node> = new Stack<Node>();

function transferVTToASTNodeDirect(vtWrap: V_T_Wrap) {
    //将vtWrap转化为AST上的节点，只用于直接推导

}