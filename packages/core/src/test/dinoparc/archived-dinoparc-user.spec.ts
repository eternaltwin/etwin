import { ObjectType } from "../../lib/core/object-type.js";
import { $ArchivedDinoparcUser, ArchivedDinoparcUser } from "../../lib/dinoparc/archived-dinoparc-user.js";
import { registerJsonIoTests } from "../helpers.js";

describe("ArchivedDinoparcUser", function () {
  registerJsonIoTests<ArchivedDinoparcUser>(
    $ArchivedDinoparcUser,
    "core/dinoparc/archived-dinoparc-user",
    new Map([
      ["alice-rokky", {
        type: ObjectType.DinoparcUser,
        server: "dinoparc.com",
        id: "1",
        archivedAt: new Date("2021-01-01T00:00:00.000Z"),
        username: "alice",
        coins: {
          latest: {
            period: {
              start: new Date("2021-01-01T00:00:00.000Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-01-01T00:00:00.000Z"),
            },
            value: 10000,
          }
        },
        dinoz: {
          latest: {
            period: {
              start: new Date("2021-01-01T00:00:00.000Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-01-01T00:00:00.000Z"),
            },
            value: [
              {
                type: ObjectType.DinoparcDinoz,
                server: "dinoparc.com",
                id: "2",
              }
            ],
          }
        },
        inventory: {
          latest: {
            period: {
              start: new Date("2021-01-01T00:00:00.000Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-01-01T00:00:00.000Z"),
            },
            value: new Map([
              ["4", 10],
            ]),
          }
        },
      }],
    ])
  );
});
