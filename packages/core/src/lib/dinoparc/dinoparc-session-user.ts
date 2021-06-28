import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/lib/array";
import { $Uint32 } from "kryo/lib/integer";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $ShortDinoparcDinoz, ShortDinoparcDinoz } from "./short-dinoparc-dinoz.js";
import { $ShortDinoparcUser, ShortDinoparcUser } from "./short-dinoparc-user.js";

export interface DinoparcSessionUser {
  user: ShortDinoparcUser;
  coins: number;
  dinoz: ShortDinoparcDinoz[];
}

export const $DinoparcSessionUser: RecordIoType<DinoparcSessionUser> = new RecordType<DinoparcSessionUser>({
  properties: {
    user: {type: $ShortDinoparcUser},
    coins: {type: $Uint32},
    dinoz: {type: new ArrayType({itemType: $ShortDinoparcDinoz, maxLength: 10000})},
  },
  changeCase: CaseStyle.SnakeCase,
});
