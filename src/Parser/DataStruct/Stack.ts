export class Stack<T> {
    private elements: Array<T>;

    constructor() {
        this.elements = new Array<T>();
    }

    push(element: T) {
        this.elements.push(element);
    }

    popX(x: number): T[] {
        let popList: T[] = [];
        if (x <= this.elements.length) {
            for (let i = 0; i < x; i++) {
                popList.push(<T>this.elements.pop());
            }
        }
        return popList;
    }

    isEmpty(): boolean {
        return this.elements.length === 0;
    }

    pop(): T {
        return this.popX(1)[0];
    }

    peek(): T | undefined {
        if (this.elements.length === 0) {
            return undefined;
        } else {
            return this.elements[this.elements.length - 1];
        }
    }

    get size(): number {
        return this.elements.length;
    }
}