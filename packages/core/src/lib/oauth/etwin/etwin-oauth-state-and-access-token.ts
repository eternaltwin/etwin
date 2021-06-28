import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $OauthAccessToken, OauthAccessToken } from "../oauth-access-token.js";
import { $EtwinOauthState, EtwinOauthState } from "./etwin-oauth-state.js";

/**
 * Interface describing the content of the `state` parameter as used by Eternal-Twin.
 *
 * It is based on the following draft: https://tools.ietf.org/html/draft-bradley-oauth-jwt-encoded-state-00
 */
export interface EtwinOauthStateAndAccessToken {
  state: EtwinOauthState;
  accessToken: OauthAccessToken;
}

export const $EtwinOauthStateAndAccessToken: RecordIoType<EtwinOauthStateAndAccessToken> = new RecordType<EtwinOauthStateAndAccessToken>({
  properties: {
    state: {type: $EtwinOauthState},
    accessToken: {type: $OauthAccessToken},
  },
  changeCase: CaseStyle.SnakeCase,
});
