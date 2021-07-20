import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/array";
import { $Uint32 } from "kryo/integer";
import { RecordIoType, RecordType } from "kryo/record";

import { $DinoparcSessionUser, DinoparcSessionUser } from "./dinoparc-session-user.js";
import { $ShortDinoparcDinozWithLevel, ShortDinoparcDinozWithLevel } from "./short-dinoparc-dinoz-with-level.js";
import { $ShortDinoparcUser, ShortDinoparcUser } from "./short-dinoparc-user.js";

export interface DinoparcExchangeWithResponse {
  sessionUser: DinoparcSessionUser;
  ownBills: number;
  ownDinoz: ShortDinoparcDinozWithLevel[];
  otherUser: ShortDinoparcUser;
  otherDinoz: ShortDinoparcDinozWithLevel[];
}

export const $DinoparcExchangeWithResponse: RecordIoType<DinoparcExchangeWithResponse> = new RecordType<DinoparcExchangeWithResponse>({
  properties: {
    sessionUser: {type: $DinoparcSessionUser},
    ownBills: {type: $Uint32},
    ownDinoz: {type: new ArrayType({itemType: $ShortDinoparcDinozWithLevel, maxLength: 20000})},
    otherUser: {type: $ShortDinoparcUser},
    otherDinoz: {type: new ArrayType({itemType: $ShortDinoparcDinozWithLevel, maxLength: 20000})},
  },
  changeCase: CaseStyle.SnakeCase,
});
