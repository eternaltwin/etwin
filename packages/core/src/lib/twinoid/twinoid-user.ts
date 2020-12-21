import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $VersionedEtwinLink, VersionedEtwinLink } from "../link/versioned-etwin-link.js";
import { $TwinoidUserDisplayName, TwinoidUserDisplayName } from "./twinoid-user-display-name.js";
import { $TwinoidUserId, TwinoidUserId } from "./twinoid-user-id.js";

export interface TwinoidUser {
  type: ObjectType.TwinoidUser;
  id: TwinoidUserId;
  displayName: TwinoidUserDisplayName;
  etwin: VersionedEtwinLink;
}

export const $TwinoidUser: RecordIoType<TwinoidUser> = new RecordType<TwinoidUser>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.TwinoidUser})},
    id: {type: $TwinoidUserId},
    displayName: {type: $TwinoidUserDisplayName},
    etwin: {type: $VersionedEtwinLink},
  },
  changeCase: CaseStyle.SnakeCase,
});
