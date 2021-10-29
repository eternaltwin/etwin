import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $OauthAccessToken, OauthAccessToken } from "../oauth-access-token.mjs";
import { $EtwinOauthState, EtwinOauthState } from "./etwin-oauth-state.mjs";

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
