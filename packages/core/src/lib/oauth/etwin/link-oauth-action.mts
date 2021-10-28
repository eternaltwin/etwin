import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $UserId, UserId } from "../../user/user-id.mjs";
import { $EtwinOauthActionType, EtwinOauthActionType } from "./etwin-oauth-action-type.mjs";

/**
 * OAuth state for the `Link` action.
 */
export interface LinkOauthAction {
  type: EtwinOauthActionType.Link;
  userId: UserId;
}

export const $LinkOauthAction: RecordIoType<LinkOauthAction> = new RecordType<LinkOauthAction>({
  properties: {
    type: {type: new LiteralType({type: $EtwinOauthActionType, value: EtwinOauthActionType.Link})},
    userId: {type: $UserId},
  },
  changeCase: CaseStyle.SnakeCase,
});
