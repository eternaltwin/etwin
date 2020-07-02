import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $OauthClientRef, OauthClientRef } from "../oauth/oauth-client-ref.js";

/**
 * A forum actor corresponding to an OAuth client.
 */
export interface ClientForumActor {
  type: ObjectType.ClientForumActor;
  client: OauthClientRef;
}

export const $ClientForumActor: RecordIoType<ClientForumActor> = new RecordType<ClientForumActor>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.ClientForumActor})},
    client: {type: $OauthClientRef},
  },
  changeCase: CaseStyle.SnakeCase,
});
