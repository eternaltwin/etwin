import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";
import { $Ucs2String } from "kryo/ucs2-string";

export interface GrantOauthAuthorizationOptions {
  clientRef?: string;
  redirectUri?: string;
  responseType?: string;
  scope?: string;
  state?: string;
}

export const $GrantOauthAuthorizationOptions: RecordIoType<GrantOauthAuthorizationOptions> = new RecordType<GrantOauthAuthorizationOptions>({
  properties: {
    clientRef: {type: $Ucs2String, optional: true},
    redirectUri: {type: $Ucs2String, optional: true},
    responseType: {type: $Ucs2String, optional: true},
    scope: {type: $Ucs2String, optional: true},
    state: {type: $Ucs2String, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
