import { CaseStyle } from "kryo";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

import { $RawUserDot, RawUserDot } from "../core/raw-user-dot.mjs";
import { $DinoparcUserIdRef, DinoparcUserIdRef } from "../dinoparc/dinoparc-user-id-ref.mjs";
import { $UserIdRef, UserIdRef } from "../user/user-id-ref.mjs";

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
