import {getVValue, T, V} from "../Parser/DataStruct/V_T";
import {createSampleToken, Token} from "../Lexer/Datastruct/Token";


let v = V.ModuleImportDefine;
console.log(getVValue(v));