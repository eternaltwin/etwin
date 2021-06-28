import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date";
import { LiteralType } from "kryo/lib/literal";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $VersionedEtwinLink, VersionedEtwinLink } from "../link/versioned-etwin-link.js";
import { $TwinoidUserDisplayName, TwinoidUserDisplayName } from "./twinoid-user-display-name.js";
import { $TwinoidUserId, TwinoidUserId } from "./twinoid-user-id.js";

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
