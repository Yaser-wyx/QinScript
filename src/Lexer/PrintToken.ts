/*
 * Copyright (c) 2020. yaser. All rights reserved
 * Description:
 */

import {Token} from "./DataStruct/Token";
import {T} from "./DataStruct/V_T";
import * as path from "path";
import {TOKEN_OUT_DIR} from "../Cli/config";
import {printInfo} from "../Log";
import {writeToFile} from "../Utils/utils";


export function printTokens(tokens: ReadonlyArray<Token>, filePath: string) {
    let data = "";
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        data += `====================第${i + 1}个token====================\n`;
        data += "token.type: " + T[token.tokenType] + "\n";
        data += "token.value: " + token.value + "\n";
        data += "token.length: " + token.length + "\n";
        data += "token.lineNo: " + token.lineNo + "\n";
        data += "token.start: " + token.start + '\n';
    }
    const endIndex = filePath.indexOf(".");
    const startIndex = filePath.lastIndexOf("\\") + 1;
    const outTokenFileName = filePath.substring(startIndex, endIndex) + '.out.tokens';
    const tokenPath = path.join(TOKEN_OUT_DIR, outTokenFileName);
    writeToFile(data,tokenPath)
}