import { ObjectType } from "../../lib/core/object-type.js";
import { $NullableShortHammerfestUser } from "../../lib/hammerfest/short-hammerfest-user.js";
import { registerJsonIoTests } from "../helpers.js";

describe("NullableShortHammerfestUser", function () {
  registerJsonIoTests(
    $NullableShortHammerfestUser,
    "hammerfest/nullable-short-hammerfest-user",
    new Map([
      ["alice", {type: ObjectType.HammerfestUser, server: "hammerfest.fr", id: "123", username: "alice"}],
      ["null", null],
    ])
  );
});
