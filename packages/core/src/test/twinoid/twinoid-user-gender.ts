import { $NullableTwinoidUserGender, TwinoidUserGender } from "../../lib/twinoid/twinoid-user-gender.js";
import { registerJsonIoTests } from "../helpers.js";

describe("NullableTwinoidUserGender", function () {
  registerJsonIoTests(
    $NullableTwinoidUserGender,
    "core/twinoid/twinoid-user-gender",
    new Map([
      [
        "female",
        TwinoidUserGender.Female,
      ],
      [
        "male",
        TwinoidUserGender.Male,
      ],
      [
        "null",
        null,
      ],
    ])
  );
});
