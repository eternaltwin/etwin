import { ObjectType } from "../../lib/core/object-type.js";
import { $ShortUser } from "../../lib/user/short-user.js";
import { registerJsonIoTests } from "../helpers.js";

describe("ShortUser", function () {
  registerJsonIoTests(
    $ShortUser,
    "core/user/short-user",
    new Map([
      [
        "demurgos",
        {
          type: ObjectType.User,
          id: "9f310484-963b-446b-af69-797feec6813f",
          displayName: {
            current: {
              value: "Demurgos",
            },
          },
        },
      ],
    ])
  );
});
