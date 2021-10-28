import { ObjectType } from "../../lib/core/object-type.mjs";
import { $NullableHammerfestUser } from "../../lib/hammerfest/hammerfest-user.mjs";
import { registerJsonIoTests } from "../helpers.mjs";

describe("NullableHammerfestUser", function () {
  registerJsonIoTests(
    $NullableHammerfestUser,
    "core/hammerfest/nullable-hammerfest-user",
    new Map([
      [
        "elseabora",
        {
          type: ObjectType.HammerfestUser as const,
          server: "hammerfest.fr" as const,
          id: "127",
          username: "Elseabora",
          archivedAt: new Date("2021-04-06T00:10:51.309Z"),
          profile: null,
          items: null,
          etwin: {
            current: {
              link: {
                time: new Date("2021-04-06T23:49:10.803Z"),
                user: {
                  type: ObjectType.User as const,
                  id: "432b288b-0efa-459b-910d-c5ea3e44a382",
                  displayName: {
                    current: {
                      value: "Elseabora",
                    },
                  },
                },
              },
              unlink: null,
              user: {
                type: ObjectType.User as const,
                id: "432b288b-0efa-459b-910d-c5ea3e44a382",
                displayName: {
                  current: {
                    value: "Elseabora",
                  },
                },
              },
            },
            old: [],
          }
        }
      ],
    ])
  );
});
