import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

import { $DinoparcSessionKey, DinoparcSessionKey } from "./dinoparc-session-key.mjs";
import { $DinoparcUserIdRef, DinoparcUserIdRef } from "./dinoparc-user-id-ref.mjs";

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
