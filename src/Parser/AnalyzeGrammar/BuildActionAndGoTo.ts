//用于构建LR分析的Action与Goto子表
import {ActionStatus} from "../DataStruct/FormItem";
import {E, EOF, Production} from "../DataStruct/Production";
import {Closure} from "../DataStruct/Closure";
import {printBuildFormError} from "../../error/error";
import {ActionForm, GotoForm} from "../DataStruct/Form";

let _ = require("lodash");

let startProduction: Production;
let productions = {};//key为产生式左部符号，value为一个数组，表示产生式右部符号(因为可能有多个右部产生式)
let firstSet = {};//key为非终结符，value为该非终结符的first集合，是set数据结构
let vSet = new Set<string>();//非终结符
let tSet = new Set<string>();//终结符
let symbols = new Set<string>([EOF]);//所有符号
let LR1: object;
let LRIndex = 0;//规范族下一个索引，也可以作为个数使用
let productionMap = {};//key为产生式值的hashcode，value为一个解析后的产生式，用于填表中确定规约的产生式
const productionSplit = "\n";
const arrowSymbol = '->';

function generateProduction(grammar: string) {
    //从指定文法中获取产生式，并将其结构化
    let items = grammar.split(productionSplit);
    items.forEach(item => {
        item = item.replace(/\r\n/g, "");
        if (item.length === 0) return;
        //遍历items
        let arrowIndex = item.indexOf(arrowSymbol);
        let key = item.substr(0, arrowIndex).trim();
        symbols.add(key);
        let productionRightList = item.substr(arrowIndex + arrowSymbol.length).split("|");//获取该产生式的所有子产生式

        productions[key] = new Array<Production>();//构建一个子产生式列表
        productionRightList.forEach(productionRight => {
            //遍历子产生式
            let production = new Production(key);//新建一个子产生式
            productionRight = productionRight.trim();
            let productionRightItems = productionRight.split(" ");//使用空格分隔
            productionRightItems.forEach(productionRightItem => {
                //添加该产生式的一个节点
                if (productionRightItem) {
                    symbols.add(productionRightItem);
                    production.pushItem(productionRightItem);
                }
            });
            let productionHash = production.getHashCode(false);//获取产生式的hash值
            productionMap[productionHash] = _.cloneDeep(production);//防止数据被污染，clone一份
            if (!startProduction) {
                startProduction = production;//初始产生式保证了只有一个
            }
            productions[key].push(production);
        });

    });
}

function getVAndT() {
    //获取终结符与非终结符
    symbols.forEach(symbol => {
        if (productions[symbol]) {
            vSet.add(symbol);
        } else {
            tSet.add(symbol);
        }
    });
    return;
}

function getLR1() {
//获取LR1规范族
    if (startProduction) {
        let startClosure = new Closure([startProduction]);//计算起始节点闭包
        let closureSets = {};
        let closureHashMap = {};
        let flag = false;
        let pushClosure = (newClosure: Closure) => {
            let name = 'I' + LRIndex;
            newClosure.name = name;
            newClosure.stateNum = LRIndex++;
            closureSets[name] = newClosure;
            flag = true;
            closureHashMap[newClosure.getHashCode()] = closureSets[name];
        };
        let initClosure = calculateClosure(startClosure);//计算初始节点闭包
        pushClosure(initClosure);
        while (flag) {
            flag = false;
            for (let closureSetsKey in closureSets) {
                let proceedClosure: Closure = closureSets[closureSetsKey];//获取一个闭包来进行计算
                if (!proceedClosure.flag) {
                    //该闭包未处理
                    let closureInnerSet: Array<Production> = proceedClosure.innerSet;//处理闭包的每一个产生式
                    let nextRecognizeSet = new Set<string>();//待识别符号集合
                    for (let production of closureInnerSet) {
                        let nextRecognize = production.getNowDotAfter();//获取该产生式当前占位符后第一个节点的值
                        if (nextRecognize !== EOF) {
                            nextRecognizeSet.add(nextRecognize);
                        }
                    }
                    nextRecognizeSet.forEach(nextRecognize => {
                        let newClosure = Go(proceedClosure, nextRecognize);
                        if (closureHashMap[newClosure.getHashCode()]) {
                            //如果当前闭包在接受一个符号计算后的新闭包是已经存在的，则直接建立连接，不再将该闭包加入
                            proceedClosure.addClosureAfterRecognizeX(nextRecognize, closureHashMap[newClosure.getHashCode()]);
                        } else {
                            proceedClosure.addClosureAfterRecognizeX(nextRecognize, newClosure);
                            pushClosure(newClosure);//计算当前闭包在识别了一个符号后，转移到的状态
                        }
                    });
                    proceedClosure.flag = true;//标记上，表示该闭包处理过了
                }
            }
        }
        LR1 = closureSets;
    }
}

function fillForm(): object | null {
    //填Action与Goto表
    if (LR1) {
        let actionForm = new ActionForm(LRIndex);//创建action表
        let gotoForm = new GotoForm(LRIndex);//创建goto表
        let reduce = (stateNum: number, expected: string, production: Production) => {
            let productionHash = production.getHashCode(false);
            actionForm.setActionItem(stateNum, ActionStatus.REDUCE, expected, productionMap[productionHash]);
        };
        let isAcc = (production: Production) => {
            return production.search === EOF && production.getHashCode(false) === startProduction.getHashCode(false);
        };
        for (let lr1Key in LR1) {
            //遍历LR1规范族表
            let closure: Closure = LR1[lr1Key];//获取一个规范族
            closure.innerSet.forEach((production: Production) => {
                let needRecognize = production.getNowDotAfter();
                let nextClosure = closure.getClosureAfterRecognizeX(needRecognize);
                if (nextClosure) {
                    //如果存在移进项目
                    if (tSet.has(needRecognize) && needRecognize !== EOF) {
                        //如果是终结符
                        if (needRecognize !== E) {
                            actionForm.setActionItem(closure.stateNum, ActionStatus.SHIFT, needRecognize, nextClosure.stateNum);
                        } else {
                            actionForm.setActionItem(closure.stateNum, ActionStatus.SHIFT_BY_E, needRecognize, nextClosure.stateNum);
                        }
                    } else if (vSet.has(needRecognize)) {
                        //如果是非终结符
                        gotoForm.setGotoItem(closure.stateNum, needRecognize, nextClosure.stateNum);
                    }
                } else if (needRecognize === EOF) {
                    //如果是eof，则表示是一个规约项目
                    if (isAcc(production)) {
                        //如果是终态
                        actionForm.setActionItem(closure.stateNum, ActionStatus.ACC, EOF,production);
                    } else {
                        reduce(closure.stateNum, production.search, production);
                    }
                }
            });
        }
        actionForm.print();
        gotoForm.print();
        printBuildFormError();
        return {actionForm: actionForm, gotoForm: gotoForm};
    }
    return null
}

export function analyzeGrammar(grammar: string): object | null {
    //开始解析语法
    generateProduction(grammar);
    getVAndT();//获取终结符与非终结符
    console.log("打印语法产生式");
    first();//计算非终结符的first集合
    console.log("获取LR1规范族");
    getLR1();
    return fillForm();
}

function printProductions(productions: object) {
    for (let key in productions) {
        let productionList: Array<Production> = productions[key];
        productionList.forEach((production: Production) => {
            console.log(production.key, ":", production.getValue());
        })
    }
}

function calculateClosure(calClosure: Closure): Closure {
    //计算一条产生式的闭包，needCalculateProduction已经是点前进过的值，Productions是原始产生式集合
    let newClosure: Closure = _.cloneDeep(calClosure);//复制一份闭包集合，不修改原有集合
    newClosure.resetProductionFlag();
    let newClosureSet = newClosure.innerSet;
    let hashSet = new Set<string>();
    let flag: boolean = true;
    let pushProduction = ((production: Production) => {
        newClosureSet.push(production);
        hashSet.add(production.getHashCode());
        flag = true
    });
    let isInArray = ((production: Production) => {
        return hashSet.has(production.getHashCode());
    });
    while (flag) {
        flag = false;//立即重置
        newClosureSet.forEach(production => {
            //production为需要计算闭包的产生式
            //遍历闭包集合
            if (!production.flag) {
                production.flag = true;
                let notT = production.getNowDotAfter();//获取占位符后的第一个非终结符
                if (vSet.has(notT)) {
                    //不为空
                    let vProductions: Array<Production> = productions[notT];//获取该非终结符对应的产生式组
                    if (vProductions) {
                        //不为空
                        for (let vProduction of vProductions) {
                            //遍历该非终结符对应的产生式组
                            let nodesToCalFirst = production.getNodeToCalFirst();//计算搜索符，需要从production中搜索
                            let searchFirstSet = getSearchFirstSet(nodesToCalFirst);
                            searchFirstSet.forEach(search => {
                                let newProduction = _.cloneDeep(vProduction);
                                newProduction.setSearch(search);
                                if (!isInArray(newProduction)) {
                                    pushProduction(newProduction);
                                }
                            });
                        }
                    }
                }
            }

        })
    }
    return newClosure;
}

function getSearchFirstSet(nodes: Array<string>): Set<string> {
    let searchSet = new Set<string>();
    for (let node of nodes) {
        //遍历每一个节点
        if (vSet.has(node)) {
            //如果是非终结符
            let fSet: Set<string> = firstSet[node];//获取该非终结符的first集合
            if (fSet) {
                fSet.forEach(value => {
                    if (value != E) {
                        searchSet.add(value);
                    }
                });
                if (!fSet.has(E)) {
                    //如果没有E
                    break;
                }
            }
        } else {
            searchSet.add(node);
            break;
        }
    }
    return searchSet;
}

function Go(closure: Closure, recognize: string): Closure {
    //从closureCollection识别一个符号后的新闭包
    let newClosure: Closure;//生成的新闭包
    let newProductionList = new Array<Production>();//需要计算闭包的产生式列表
    for (let production of closure.innerSet) {
        //遍历该闭包的产生式
        if (production.getNowDotAfter() === recognize) {
            //如果可以匹配
            let newProduction = _.cloneDeep(production);//新建一个产生式
            if (newProduction.advance()) {//将该产生式的.前进一位
                //如果可以前进
                newProductionList.push(newProduction);//将该产生式加入到要计算闭包的产生式列表中
            }
        }
    }
    newClosure = calculateClosure(new Closure(newProductionList));//获取由该闭包计算后的新闭包
    return newClosure;
}

//计算文法first集合
function first() {
    let flag = true;
    let addFirstSet = (key: string, value: string) => {
        if (firstSet[key]) {
            if (!firstSet[key].has(value)) {
                flag = true;
                firstSet[key].add(value);
            }
        } else {
            firstSet[key] = new Set<string>([value]);
            flag = true;
        }
    };
    let isV = (value) => {
        return vSet.has(value);
    };
    while (flag) {
        flag = false;
        vSet.forEach(key => {
            //遍历所有非终结符
            let productionList: Array<Production> = productions[key];//获取该非终结符所有的产生式
            productionList.forEach((production: Production) => {
                //遍历所有产生式
                let index = 0;
                for (let symbol of production.nodeList) {
                    //遍历该产生式的所有节点
                    if (isV(symbol)) {
                        //如果是非终结符
                        let valueFirstSet: Set<string> = firstSet[symbol];
                        if (valueFirstSet) {
                            //如果集合不为空
                            if (valueFirstSet.has(E)) {
                                //如果集合存在E，则需要继续遍历下一个，同时将当前的集合除E外全部加入
                                valueFirstSet.forEach(value => {
                                    if (value !== E) {
                                        addFirstSet(key, value);
                                    }
                                });
                                if (index === production.nodeList.length - 1) {
                                    //最后一个node了，但任然有E，则加入它
                                    addFirstSet(key, E);
                                }
                            } else {
                                //如果不存在E，则表示不需要遍历下一个，同时将当前的集合除E外全部加入
                                valueFirstSet.forEach(value => {
                                    addFirstSet(key, value);
                                });
                                break;
                            }
                        } else {
                            //集合为空则退出
                            break;
                        }
                    } else {
                        //如果是终结符
                        addFirstSet(key, symbol);
                        break;
                    }
                    index++;
                }
            })
        })
    }
}
