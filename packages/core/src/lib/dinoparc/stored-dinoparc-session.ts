import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TryUnionType } from "kryo/lib/try-union.js";

import { $DinoparcSessionKey, DinoparcSessionKey } from "./dinoparc-session-key.js";
import { $DinoparcUserIdRef, DinoparcUserIdRef } from "./dinoparc-user-id-ref.js";

export interface StoredDinoparcSession {
  ctime: Date;
  atime: Date;
  key: DinoparcSessionKey;
  user: DinoparcUserIdRef;
}

export const $StoredDinoparcSession: RecordIoType<StoredDinoparcSession> = new RecordType<StoredDinoparcSession>({
  properties: {
    ctime: {type: $Date},
    atime: {type: $Date},
    key: {type: $DinoparcSessionKey},
    user: {type: $DinoparcUserIdRef},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableStoredDinoparcSession = null | StoredDinoparcSession;

export const $NullableStoredDinoparcSession: TryUnionType<NullableStoredDinoparcSession> = new TryUnionType({variants: [$Null, $StoredDinoparcSession]});
