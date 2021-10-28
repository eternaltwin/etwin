import { ObjectType } from "../../lib/core/object-type.mjs";
import { $HammerfestShopResponse, HammerfestShopResponse } from "../../lib/hammerfest/hammerfest-shop-response.mjs";
import { registerJsonIoTests } from "../helpers.mjs";

describe("HammerfestShopResponse", function () {
  registerJsonIoTests<HammerfestShopResponse>(
    $HammerfestShopResponse,
    "core/hammerfest/hammerfest-shop-response",
    new Map([
      ["maniaclan", {
        session: {
          user: {
            type: ObjectType.HammerfestUser,
            server: "hammerfest.fr",
            id: "176431",
            username: "maniaclan",
          },
          tokens: 5096,
        },
        shop: {
          hasQuestBonus: true,
          purchasedTokens: null,
          weeklyTokens: 14,
        }
      }],
    ])
  );
});
