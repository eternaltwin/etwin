import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $ShortOauthClient, ShortOauthClient } from "../oauth/short-oauth-client.js";

/**
 * A forum actor corresponding to an OAuth client.
 */
export interface ClientForumActor {
  type: ObjectType.ClientForumActor;
  client: ShortOauthClient;
}

export const $ClientForumActor: RecordIoType<ClientForumActor> = new RecordType<ClientForumActor>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.ClientForumActor})},
    client: {type: $ShortOauthClient},
  },
  changeCase: CaseStyle.SnakeCase,
});
