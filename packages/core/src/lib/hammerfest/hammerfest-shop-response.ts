import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $HammerfestSessionUser, HammerfestSessionUser } from "./hammerfest-session-user.js";
import { $HammerfestShop, HammerfestShop } from "./hammerfest-shop.js";

export interface HammerfestShopResponse {
  session: HammerfestSessionUser;
  shop: HammerfestShop;
}

export const $HammerfestShopResponse: RecordIoType<HammerfestShopResponse> = new RecordType<HammerfestShopResponse>({
  properties: {
    session: {type: $HammerfestSessionUser},
    shop: {type: $HammerfestShop},
  },
  changeCase: CaseStyle.SnakeCase,
});
