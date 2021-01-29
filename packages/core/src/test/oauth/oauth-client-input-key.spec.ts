import { $OauthClientInputKey } from "../../lib/oauth/oauth-client-input-key.js";
import { registerJsonIoTests } from "../helpers.js";

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
