import { ObjectType } from "../../lib/core/object-type.mjs";
import { $NullableShortHammerfestUser } from "../../lib/hammerfest/short-hammerfest-user.mjs";
import { registerJsonIoTests } from "../helpers.mjs";

describe("NullableShortHammerfestUser", function () {
  registerJsonIoTests(
    $NullableShortHammerfestUser,
    "core/hammerfest/nullable-short-hammerfest-user",
    new Map([
      ["alice", {type: ObjectType.HammerfestUser, server: "hammerfest.fr", id: "123", username: "alice"}],
      ["null", null],
    ])
  );
});
