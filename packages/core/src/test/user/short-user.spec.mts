import { ObjectType } from "../../lib/core/object-type.mjs";
import { $ShortUser } from "../../lib/user/short-user.mjs";
import { registerJsonIoTests } from "../helpers.mjs";

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
