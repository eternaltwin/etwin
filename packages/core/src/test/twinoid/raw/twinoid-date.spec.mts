import { $TwinoidDate } from "../../../lib/twinoid/raw/twinoid-date.mjs";
import { registerJsonIoTests } from "../../helpers.mjs";

describe("TwinoidDate", function () {
  registerJsonIoTests(
    $TwinoidDate,
    "core/twinoid/raw/twinoid-date",
    new Map([
      [
        "demurgos-birthday",
        new Date("1995-09-27T00:00:00.000Z"),
      ],
    ])
  );
});
