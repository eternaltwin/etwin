import { ObjectType } from "../../lib/core/object-type.js";
import { $HammerfestShopResponse, HammerfestShopResponse } from "../../lib/hammerfest/hammerfest-shop-response.js";
import { registerJsonIoTests } from "../helpers.js";

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
