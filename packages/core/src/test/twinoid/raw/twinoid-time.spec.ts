import { $TwinoidTime } from "../../../lib/twinoid/raw/twinoid-time.js";
import { registerJsonIoTests } from "../../helpers.js";

describe("TwinoidTime", function () {
  registerJsonIoTests(
    $TwinoidTime,
    "core/twinoid/raw/twinoid-time",
    new Map([
      [
        "demurgos-oldname",
        new Date("2012-02-25T16:07:05.000Z"),
      ],
    ])
  );
});
