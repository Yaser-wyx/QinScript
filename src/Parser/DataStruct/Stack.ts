export class Stack<T> {
    private elements: Array<T>;

    constructor(initValue: T | null = null) {
        this.elements = new Array<T>();
        if (initValue!==null) {
            this.elements.push(initValue);
        }
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
        return popList.reverse();
    }

    isEmpty(): boolean {
        return this.elements.length === 0;
    }

    pop(): T {
        return this.popX(1)[0];
    }

    peek(): T | null {
        if (this.elements.length === 0) {
            return null;
        } else {
            return this.elements[this.elements.length - 1];
        }
    }

    peekX(step: number): T | null {
        if (this.elements.length === 0) {
            return null;
        } else {
            return this.elements[this.elements.length - step];
        }
    }

    get size(): number {
        return this.elements.length;
    }
}