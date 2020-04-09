class node {
    left: node | null = null;
    value: number;
    right: node | null = null;

    constructor(value: number) {
        this.value = value;
    }
}

let root = new node(0);
const depth = 100;
for (let i = 0; i < depth; i++) {

}
