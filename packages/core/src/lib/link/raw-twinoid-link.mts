import { CaseStyle } from "kryo";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

import { $RawUserDot, RawUserDot } from "../core/raw-user-dot.mjs";
import { $TwinoidUserIdRef, TwinoidUserIdRef } from "../twinoid/twinoid-user-id-ref.mjs";
import { $UserIdRef, UserIdRef } from "../user/user-id-ref.mjs";

export interface RawTwinoidLink {
  link: RawUserDot;
  unlink: null;
  etwin: UserIdRef;
  remote: TwinoidUserIdRef;
}

export const $RawTwinoidLink: RecordIoType<RawTwinoidLink> = new RecordType<RawTwinoidLink>({
  properties: {
    link: {type: $RawUserDot},
    unlink: {type: $Null},
    etwin: {type: $UserIdRef},
    remote: {type: $TwinoidUserIdRef},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableRawTwinoidLink = null | RawTwinoidLink;

export const $NullableRawTwinoidLink: TryUnionType<NullableRawTwinoidLink> = new TryUnionType({variants: [$Null, $RawTwinoidLink]});
