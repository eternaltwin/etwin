import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { $Ucs2String } from "kryo/lib/ucs2-string.js";

import { $EtwinOauthAction, EtwinOauthAction } from "./etwin-oauth-action.js";

/**
 * Interface describing the content of the `state` parameter as used by Eternal-Twin.
 *
 * It is based on the following draft: https://tools.ietf.org/html/draft-bradley-oauth-jwt-encoded-state-00
 */
export interface EtwinOauthStateInput {
  /**
   * String used for XSRF protection.
   */
  requestForgeryProtection: string;

  action: EtwinOauthAction;
}

export const $EtwinOauthStateInput: RecordIoType<EtwinOauthStateInput> = new RecordType<EtwinOauthStateInput>({
  properties: {
    requestForgeryProtection: {type: $Ucs2String, rename: "rfp"},
    action: {type: $EtwinOauthAction, rename: "a"},
  },
});
