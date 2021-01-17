import { ObjectType } from "../../lib/core/object-type.js";
import { CompleteSimpleUser } from "../../lib/user/complete-simple-user";
import { $GetUserResult } from "../../lib/user/get-user-result.js";
import { ShortUser } from "../../lib/user/short-user.js";
import { SimpleUser } from "../../lib/user/simple-user.js";
import { registerJsonIoTests } from "../helpers.js";

describe("GetUserResult", function () {
  registerJsonIoTests(
    $GetUserResult,
    "core/user/get-user-result",
    new Map([
      [
        "complete",
        {
          type: ObjectType.User,
          id: "abeb9363-2035-4c20-9bb8-21edfb432cbf",
          createdAt: new Date("2021-01-15T14:17:14.015Z"),
          displayName: {
            current: {
              value: "Alice",
            },
          },
          isAdministrator: true,
          username: "alice",
          emailAddress: null,
        } as CompleteSimpleUser,
      ],
      [
        "default",
        {
          type: ObjectType.User,
          id: "28dbb0bf-0fdc-40fe-ae5a-dde193f9fea8",
          createdAt: new Date("2021-01-15T14:17:14.015Z"),
          displayName: {
            current: {
              value: "Alice",
            },
          },
          isAdministrator: true,
        } as SimpleUser,
      ],
      [
        "short",
        {
          type: ObjectType.User,
          id: "e9c17533-633e-4f60-be9e-72883ae0174a",
          displayName: {
            current: {
              value: "Alice",
            },
          },
        } as ShortUser,
      ],
    ])
  );
});
