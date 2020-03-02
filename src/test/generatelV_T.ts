import {readFromFile, writeToFile} from "../Utils/utils";
import {GRAMMAR_FILE} from "../Cli/config";

let v = new Set();
let t = new Set();

async function read() {
    let grammar = await readFromFile(GRAMMAR_FILE);
    let str = grammar.split(/\s/);

    str.forEach(item => {
        if (!(item === "|" || item === "->" || item.length === 0)) {
            let testLow = /[a-z]/g;
            if (testLow.test(item)) {
                v.add(item);
            } else {
                t.add(item);
            }
        }
    });
    let vData = "";
    let tData = "";
    v.forEach(item => {
        vData += item + ",\n";
    })
    t.forEach(item => {
        tData += item + ",\n";
    })
    await writeToFile(vData, "V.txt", false);
    await writeToFile(tData, "T.txt", false);


}

