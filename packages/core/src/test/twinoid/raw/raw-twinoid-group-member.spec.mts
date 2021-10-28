import { $RawTwinoidGroupMember } from "../../../lib/twinoid/raw/raw-twinoid-group-member.mjs";
import { registerJsonIoTests } from "../../helpers.mjs";

describe("RawTwinoidGroupMember", function () {
  registerJsonIoTests(
    $RawTwinoidGroupMember,
    "core/twinoid/raw/raw-twinoid-group-member",
    new Map([
      [
        "demurgos-alchimix",
        {
          group: {
            id: 2351,
          },
          user: {
            id: 38,
          },
          title: "",
          role: {
            id: 0,
            name: "Alchimiste"
          },
        },
      ],
      [
        "demurgos-hammerfest",
        {
          group: {
            id: 1035,
          },
          user: {
            id: 38,
          },
          title: "Créateur",
          role: {
            id: -1,
            name: ""
          },
        },
      ],
      [
        "demurgos-ludum-daristes",
        {
          group: {
            id: 1548,
          },
          user: {
            id: 38,
          },
          title: "",
          role: {
            id: 2,
            name: "Dariste"
          },
        },
      ],
    ])
  );
});
