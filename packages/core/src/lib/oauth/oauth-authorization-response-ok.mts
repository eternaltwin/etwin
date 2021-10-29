import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $OauthCode, OauthCode } from "./oauth-code.mjs";
import { $OauthState, OauthState } from "./oauth-state.mjs";

export interface OauthAuthorizationResponseOk {
  error: undefined;
  code: OauthCode;
  state?: OauthState;
}

export const $OauthAuthorizationResponseOk: RecordIoType<OauthAuthorizationResponseOk> = new RecordType<any>({
  properties: {
    code: {type: $OauthCode},
    state: {type: $OauthState, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
