import { ObjectType } from "../../lib/core/object-type.mjs";
import { $EtwinDinoparcUser, EtwinDinoparcUser } from "../../lib/dinoparc/etwin-dinoparc-user.mjs";
import { registerJsonIoTests } from "../helpers.mjs";

describe("EtwinDinoparcUser", function () {
  registerJsonIoTests<EtwinDinoparcUser>(
    $EtwinDinoparcUser,
    "core/dinoparc/etwin-dinoparc-user",
    new Map([
      ["demurgos", {
        type: ObjectType.DinoparcUser,
        server: "dinoparc.com",
        id: "2480723",
        archivedAt: new Date("2020-12-18T00:56:12.769Z"),
        username: "demurgos",
        coins: null,
        dinoz: null,
        inventory: null,
        collection: null,
        etwin: {
          current: {
            link: {
              time: new Date("2020-12-18T00:56:12.769Z"),
              user: {
                type: ObjectType.User,
                id: "9f310484-963b-446b-af69-797feec6813f",
                displayName: {
                  current: {
                    value: "Demurgos",
                  },
                },
              },
            },
            unlink: null,
            user: {
              type: ObjectType.User,
              id: "9f310484-963b-446b-af69-797feec6813f",
              displayName: {
                current: {
                  value: "Demurgos",
                },
              },
            },
          },
          old: [],
        },
      }],
      ["demurgos2", {
        type: ObjectType.DinoparcUser,
        server: "dinoparc.com",
        id: "2480723",
        archivedAt: new Date("2020-12-18T00:56:12.769Z"),
        username: "demurgos",
        coins: {
          latest: {
            period: {
              start: new Date("2021-06-25T15:20:28.562Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-06-25T15:20:28.600Z"),
            },
            value: 3000,
          },
        },
        dinoz: {
          latest: {
            period: {
              start: new Date("2021-06-25T15:20:28.562Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-06-25T15:20:28.600Z"),
            },
            value: [
              {
                type: ObjectType.DinoparcDinoz,
                server: "dinoparc.com",
                id: "3749448",
              },
            ],
          },
        },
        inventory: {
          latest: {
            period: {
              start: new Date("2021-06-25T15:20:28.562Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-06-25T15:20:28.562Z"),
            },
            value: new Map([
              ["1", 3],
              ["3", 2],
            ]),
          },
        },
        collection: null,
        etwin: {
          current: {
            link: {
              time: new Date("2020-12-18T00:56:12.769Z"),
              user: {
                type: ObjectType.User,
                id: "9f310484-963b-446b-af69-797feec6813f",
                displayName: {
                  current: {
                    value: "Demurgos",
                  },
                },
              },
            },
            unlink: null,
            user: {
              type: ObjectType.User,
              id: "9f310484-963b-446b-af69-797feec6813f",
              displayName: {
                current: {
                  value: "Demurgos",
                },
              },
            },
          },
          old: [],
        },
      }],
    ])
  );
});
