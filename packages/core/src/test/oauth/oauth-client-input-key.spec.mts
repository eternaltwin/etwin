import { $OauthClientInputKey } from "../../lib/oauth/oauth-client-input-key.mjs";
import { registerJsonIoTests } from "../helpers.mjs";

describe("OauthClientInputKey", function () {
  registerJsonIoTests(
    $OauthClientInputKey,
    "core/oauth/oauth-client-input-key",
    new Map([
      ["bare", "eternalfest"],
      ["typed", "eternalfest@clients"],
    ])
  );
});
