@module:Main;
import:Array;
//栈
static fun Stack(array) {
    static let x = [];
    static let index = 0;
    while(index < Array::len(array)){
        x[index] = array[index];
        index++;
    }
    @fun push(el){
        x[index] = el;
    }
    @fun pop(){
        index--;
        return x[index];
    }
    @fun getX(){
        return x;
    }
    @fun getSize(){
        return index;
    }
}

fun main(){
    let temp = Stack();
    temp.push("");
}

static fun node(val){
    static let value = val;
    static let left;
    static let right;
}
//二叉树
static fun binaryTree(rootValue){
    static let root;
    root = node(rootValue);

    @fun insert(node,nowNode){
        if(nowNode == null){
            nowNode = node;
            return;
        }
        if(nowNode.value > node.value){
            nowNode = nowNode.left;
            insert(node,nowNode);
        }else {
            if(nowNode.value < node.value){
                nowNode = nowNode.right;
                insert(node,nowNode);
            }
        }
    }
}
