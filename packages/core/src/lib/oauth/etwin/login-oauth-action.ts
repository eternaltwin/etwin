import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $EtwinOauthActionType, EtwinOauthActionType } from "./etwin-oauth-action-type.js";

/**
 * OAuth state for the `Login` action.
 */
export interface LoginOauthAction {
  type: EtwinOauthActionType.Login;
}

export const $LoginOauthAction: RecordIoType<LoginOauthAction> = new RecordType<LoginOauthAction>({
  properties: {
    type: {type: new LiteralType({type: $EtwinOauthActionType, value: EtwinOauthActionType.Login})},
  },
  changeCase: CaseStyle.SnakeCase,
});
