import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

import { $DinoparcSessionKey, DinoparcSessionKey } from "./dinoparc-session-key.mjs";
import { $ShortDinoparcUser, ShortDinoparcUser } from "./short-dinoparc-user.mjs";

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
