import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/array";
import { $Uint32 } from "kryo/integer";
import { RecordIoType, RecordType } from "kryo/record";

import { $ShortDinoparcDinozWithLocation, ShortDinoparcDinozWithLocation } from "./short-dinoparc-dinoz-with-location.mjs";
import { $ShortDinoparcUser, ShortDinoparcUser } from "./short-dinoparc-user.mjs";

export interface DinoparcSessionUser {
  user: ShortDinoparcUser;
  coins: number;
  dinoz: ShortDinoparcDinozWithLocation[];
}

export const $DinoparcSessionUser: RecordIoType<DinoparcSessionUser> = new RecordType<DinoparcSessionUser>({
  properties: {
    user: {type: $ShortDinoparcUser},
    coins: {type: $Uint32},
    dinoz: {type: new ArrayType({itemType: $ShortDinoparcDinozWithLocation, maxLength: 10000})},
  },
  changeCase: CaseStyle.SnakeCase,
});
