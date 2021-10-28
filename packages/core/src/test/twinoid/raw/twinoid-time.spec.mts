import { $TwinoidTime } from "../../../lib/twinoid/raw/twinoid-time.mjs";
import { registerJsonIoTests } from "../../helpers.mjs";

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
