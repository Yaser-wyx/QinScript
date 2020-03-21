export class HashFile{
    //hash文件的数据结构
    hashValue:number;//grammar文件内容的hash值
    hashDate:number;//grammar文件的修改日期hash值
    constructor(hashValue: number, hashDate: number) {
        this.hashValue = hashValue;
        this.hashDate = hashDate;
    }
}