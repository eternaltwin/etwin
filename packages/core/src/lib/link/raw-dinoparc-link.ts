import { CaseStyle } from "kryo";
import { $Null } from "kryo/lib/null";
import { RecordIoType, RecordType } from "kryo/lib/record";
import { TryUnionType } from "kryo/lib/try-union";

import { $RawUserDot, RawUserDot } from "../core/raw-user-dot.js";
import { $DinoparcUserIdRef, DinoparcUserIdRef } from "../dinoparc/dinoparc-user-id-ref.js";
import { $UserIdRef, UserIdRef } from "../user/user-id-ref.js";

export interface RawDinoparcLink {
  link: RawUserDot;
  unlink: null;
  etwin: UserIdRef;
  remote: DinoparcUserIdRef;
}

export const $RawDinoparcLink: RecordIoType<RawDinoparcLink> = new RecordType<RawDinoparcLink>({
  properties: {
    link: {type: $RawUserDot},
    unlink: {type: $Null},
    etwin: {type: $UserIdRef},
    remote: {type: $DinoparcUserIdRef},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableRawDinoparcLink = null | RawDinoparcLink;

export const $NullableRawDinoparcLink: TryUnionType<NullableRawDinoparcLink> = new TryUnionType({variants: [$Null, $RawDinoparcLink]});
