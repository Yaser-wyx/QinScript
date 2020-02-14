import * as fs from "fs"
import {cli} from "./cli/QScli";
import {printFatalError} from "./error/error";
import {parser} from "./parser/Parser";
import {EOF} from "./lexer/Token";

async function run() {
    let filePath = await cli();

    await parser(filePath);
}
