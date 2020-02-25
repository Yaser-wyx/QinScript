export class HashFile{
    //hash文件的数据结构
    hashValue:number;
    hashDate:number;


    constructor(hashValue: number, hashDate: number) {
        this.hashValue = hashValue;
        this.hashDate = hashDate;
    }
}