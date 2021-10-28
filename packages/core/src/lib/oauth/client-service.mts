import { Url } from "../core/url.mjs";
import { EtwinOauthStateAndAccessToken } from "./etwin/etwin-oauth-state-and-access-token.mjs";
import { EtwinOauthStateInput } from "./etwin/etwin-oauth-state-input.mjs";
import { OauthCode } from "./oauth-code.mjs";
import { OauthState } from "./oauth-state.mjs";
import { RfcOauthScope } from "./rfc-oauth-scope.mjs";

export interface OauthClientService {
  createAuthorizationRequest(state: EtwinOauthStateInput, scopes: readonly RfcOauthScope[]): Promise<Url>;

  getAccessToken(rawState: OauthState, code: OauthCode): Promise<EtwinOauthStateAndAccessToken>;
}
