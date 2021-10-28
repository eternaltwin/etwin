import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $HammerfestServer, HammerfestServer } from "../hammerfest/hammerfest-server.mjs";
import { $HammerfestSessionKey, HammerfestSessionKey } from "../hammerfest/hammerfest-session-key.mjs";
import { $LinkToHammerfestMethod, LinkToHammerfestMethod } from "./link-to-hammerfest-method.mjs";
import { $UserId, UserId } from "./user-id.mjs";

export interface LinkToHammerfestWithSessionKeyOptions {
  method: LinkToHammerfestMethod.SessionKey;

  /**
   * Id of the Eternal-Twin user to link.
   */
  userId: UserId;

  /**
   * Hammerfest server.
   */
  hammerfestServer: HammerfestServer;

  /**
   * Session key for the Hammerfest user.
   */
  hammerfestSessionKey: HammerfestSessionKey;
}

export const $LinkToHammerfestWithSessionKeyOptions: RecordIoType<LinkToHammerfestWithSessionKeyOptions> = new RecordType<LinkToHammerfestWithSessionKeyOptions>({
  properties: {
    method: {type: new LiteralType({type: $LinkToHammerfestMethod, value: LinkToHammerfestMethod.SessionKey})},
    userId: {type: $UserId},
    hammerfestServer: {type: $HammerfestServer},
    hammerfestSessionKey: {type: $HammerfestSessionKey},
  },
  changeCase: CaseStyle.SnakeCase,
});
