import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $OauthAccessToken, OauthAccessToken } from "../oauth/oauth-access-token.mjs";
import { $LinkToTwinoidMethod, LinkToTwinoidMethod } from "./link-to-twinoid-method.mjs";
import { $UserId, UserId } from "./user-id.mjs";

export interface LinkToTwinoidWithOauthOptions {
  method: LinkToTwinoidMethod.Oauth;

  /**
   * Id of the Eternal-Twin user to link.
   */
  userId: UserId;

  /**
   * Oauth access token.
   */
  accessToken: OauthAccessToken;
}

export const $LinkToTwinoidWithOauthOptions: RecordIoType<LinkToTwinoidWithOauthOptions> = new RecordType<LinkToTwinoidWithOauthOptions>({
  properties: {
    method: {type: new LiteralType({type: $LinkToTwinoidMethod, value: LinkToTwinoidMethod.Oauth})},
    userId: {type: $UserId},
    accessToken: {type: $OauthAccessToken},
  },
  changeCase: CaseStyle.SnakeCase,
});
