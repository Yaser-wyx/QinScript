import {T} from "../Parser/DataStruct/V_T";
import {createSampleToken, Token} from "../Lexer/Datastruct/Token";


let token = createSampleToken(T.ADD, "+");
let typeValue = token.getTokenTypeValue();
console.log(typeValue);