import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $OauthAuthorizationError, OauthAuthorizationError } from "./oauth-authorization-error.mjs";
import { $OauthState, OauthState } from "./oauth-state.mjs";

export interface OauthAuthorizationResponseError {
  error: OauthAuthorizationError;
  state?: OauthState;
}

export const $OauthAuthorizationResponseError: RecordIoType<OauthAuthorizationResponseError> = new RecordType<OauthAuthorizationResponseError>({
  properties: {
    error: {type: $OauthAuthorizationError},
    state: {type: $OauthState, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
