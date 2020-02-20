import {Production} from "./Production";

export class GotoFormItem {
    //LR分析表中Goto子表的项目
    nextStatus: number;
    key: string;
    whichProduction: Production;

    constructor(nextStatus: number, key: string, whichProduction: Production) {
        this.nextStatus = nextStatus;
        this.key = key;
        this.whichProduction = whichProduction;
    }
}

export enum Status {
    ACC,
    SHIFT,
    REDUCE,
    ERROR
}

export class ActionFormItem {
    //LR分析表中Action子表的项目
    nextStatus: number;
    private _status: Status = Status.ERROR;
    key: string;
    whichProduction: Production;

    get status(): Status {
        return this._status;
    }

    constructor(nextStatus: number, key: string, whichProduction: Production, status?: Status) {
        this.nextStatus = nextStatus;
        this.key = key;
        this.whichProduction = whichProduction;
        this.setStatus(status);
    }

    setStatus(status?: Status) {
        if (status) {
            this._status = status;
        }
    }
}