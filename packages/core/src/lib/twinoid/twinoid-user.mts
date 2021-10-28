import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $ObjectType, ObjectType } from "../core/object-type.mjs";
import { $VersionedEtwinLink, VersionedEtwinLink } from "../link/versioned-etwin-link.mjs";
import { $TwinoidUserDisplayName, TwinoidUserDisplayName } from "./twinoid-user-display-name.mjs";
import { $TwinoidUserId, TwinoidUserId } from "./twinoid-user-id.mjs";

export interface TwinoidUser {
  type: ObjectType.TwinoidUser;
  id: TwinoidUserId;
  archivedAt: Date;
  displayName: TwinoidUserDisplayName;
  etwin: VersionedEtwinLink;
}

export const $TwinoidUser: RecordIoType<TwinoidUser> = new RecordType<TwinoidUser>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.TwinoidUser})},
    id: {type: $TwinoidUserId},
    archivedAt: {type: $Date},
    displayName: {type: $TwinoidUserDisplayName},
    etwin: {type: $VersionedEtwinLink},
  },
  changeCase: CaseStyle.SnakeCase,
});
