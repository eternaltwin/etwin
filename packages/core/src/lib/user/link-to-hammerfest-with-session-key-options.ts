import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $HammerfestServer, HammerfestServer } from "../hammerfest/hammerfest-server.js";
import { $HammerfestSessionKey, HammerfestSessionKey } from "../hammerfest/hammerfest-session-key.js";
import { $LinkToHammerfestMethod, LinkToHammerfestMethod } from "./link-to-hammerfest-method.js";
import { $UserId, UserId } from "./user-id.js";

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
