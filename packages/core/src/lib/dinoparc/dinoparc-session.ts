import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TryUnionType } from "kryo/lib/try-union.js";

import { $DinoparcSessionKey, DinoparcSessionKey } from "./dinoparc-session-key.js";
import { $ShortDinoparcUser, ShortDinoparcUser } from "./short-dinoparc-user.js";

export interface DinoparcSession {
  ctime: Date;
  atime: Date;
  key: DinoparcSessionKey;
  user: ShortDinoparcUser;
}

export const $DinoparcSession: RecordIoType<DinoparcSession> = new RecordType<DinoparcSession>({
  properties: {
    ctime: {type: $Date},
    atime: {type: $Date},
    key: {type: $DinoparcSessionKey},
    user: {type: $ShortDinoparcUser},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableDinoparcSession = null | DinoparcSession;

export const $NullableDinoparcSession: TryUnionType<NullableDinoparcSession> = new TryUnionType({variants: [$Null, $DinoparcSession]});
