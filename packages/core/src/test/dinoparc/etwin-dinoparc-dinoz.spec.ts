import { ObjectType } from "../../lib/core/object-type.js";
import { $EtwinDinoparcDinoz, EtwinDinoparcDinoz } from "../../lib/dinoparc/etwin-dinoparc-dinoz.js";
import { registerJsonIoTests } from "../helpers.js";

describe("EtwinDinoparcDinoz", function () {
  registerJsonIoTests<EtwinDinoparcDinoz>(
    $EtwinDinoparcDinoz,
    "core/dinoparc/etwin-dinoparc-dinoz",
    new Map([
      ["black-devil", {
        type: ObjectType.DinoparcDinoz,
        server: "dinoparc.com",
        id: "3453835",
        archivedAt: new Date("2021-06-23T13:54:46.935Z"),
        name: {
          latest: {
            period: {
              start: new Date("2021-06-23T13:54:46.935Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-06-25T15:15:50.062Z"),
            },
            value: "Black Devil",
          },
        },
        owner: {
          latest: {
            period: {
              start: new Date("2021-06-23T13:54:46.935Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-06-25T15:15:50.062Z"),
            },
            value: {
              type: ObjectType.DinoparcUser,
              server: "dinoparc.com",
              id: "205944",
              username: "djtoph"
            },
          },
        },
        location: {
          latest: {
            period: {
              start: new Date("2021-06-23T13:54:46.935Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-06-25T15:15:50.062Z"),
            },
            value: "0",
          },
        },
        race: {
          latest: {
            period: {
              start: new Date("2021-06-23T13:54:47.670Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-06-25T15:15:49.651Z"),
            },
            value: "Kump",
          },
        },
        skin: {
          latest: {
            period: {
              start: new Date("2021-06-23T13:54:47.670Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-06-25T15:15:49.651Z"),
            },
            value: "CBUfOj64r0ZaVmk#",
          },
        },
        life: {
          latest: {
            period: {
              start: new Date("2021-06-23T13:54:47.670Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-06-25T15:15:49.651Z"),
            },
            value: 0,
          },
        },
        level: {
          latest: {
            period: {
              start: new Date("2021-06-23T13:54:47.670Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-06-25T15:15:49.651Z"),
            },
            value: 288,
          },
        },
        experience: {
          latest: {
            period: {
              start: new Date("2021-06-23T13:54:47.670Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-06-25T15:15:49.651Z"),
            },
            value: 2,
          },
        },
        danger: {
          latest: {
            period: {
              start: new Date("2021-06-23T13:54:47.670Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-06-25T15:15:49.651Z"),
            },
            value: -231,
          },
        },
        inTournament: {
          latest: {
            period: {
              start: new Date("2021-06-23T13:54:47.670Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-06-25T15:15:49.651Z"),
            },
            value: false,
          },
        },
        elements: {
          latest: {
            period: {
              start: new Date("2021-06-23T13:54:47.670Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-06-25T15:15:49.651Z"),
            },
            value: {
              fire: 23,
              earth: 79,
              water: 111,
              thunder: 67,
              air: 16,
            },
          },
        },
        skills: {
          latest: {
            period: {
              start: new Date("2021-06-23T13:54:47.670Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-06-25T15:15:49.651Z"),
            },
            value: new Map([
              ["Bargain", 5],
              ["Camouflage", 2],
              ["Climb", 5],
              ["Cook", 5],
              ["Counterattack", 1],
              ["Dexterity", 1],
              ["Dig", 5],
              ["EarthApprentice", 5],
              ["FireApprentice", 5],
              ["Intelligence", 5],
              ["Jump", 5],
              ["Luck", 4],
              ["MartialArts", 5],
              ["Medicine", 5],
              ["Music", 5],
              ["Navigation", 5],
              ["Perception", 5],
              ["Provoke", 5],
              ["Run", 5],
              ["ShadowPower", 5],
              ["Stamina", 5],
              ["Steal", 5],
              ["Strategy", 1],
              ["Strength", 4],
              ["Survival", 4],
              ["Swim", 5],
              ["ThunderApprentice", 5],
              ["TotemThief", 1],
              ["WaterApprentice", 5],
            ]),
          },
        },
      }],
      ["unnamed", {
        type: ObjectType.DinoparcDinoz,
        server: "dinoparc.com",
        id: "3561648",
        archivedAt: new Date("2021-01-01T00:00:00.000Z"),
        name: {
          latest: {
            period: {
              start: new Date("2021-01-01T00:00:00.000Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-01-01T00:00:00.000Z"),
            },
            value: null,
          },
        },
        owner: {
          latest: {
            period: {
              start: new Date("2021-01-01T00:00:00.000Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-01-01T00:00:00.000Z"),
            },
            value: {
              type: ObjectType.DinoparcUser,
              server: "dinoparc.com",
              id: "205944",
              username: "djtoph"
            },
          },
        },
        location: null,
        race: {
          latest: {
            period: {
              start: new Date("2021-01-01T00:00:00.000Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-01-01T00:00:00.000Z"),
            },
            value: "Cargou",
          },
        },
        skin: {
          latest: {
            period: {
              start: new Date("2021-01-01T00:00:00.000Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-01-01T00:00:00.000Z"),
            },
            value: "6eLfXvvKAabR6TNY",
          },
        },
        life: null,
        level: {
          latest: {
            period: {
              start: new Date("2021-01-01T00:00:00.000Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-01-01T00:00:00.000Z"),
            },
            value: 1,
          },
        },
        experience: null,
        danger: null,
        inTournament: null,
        elements: null,
        skills: null,
      }],
      ["yasumi", {
        type: ObjectType.DinoparcDinoz,
        server: "en.dinoparc.com",
        id: "765483",
        archivedAt: new Date("2021-01-01T00:00:00.000Z"),
        name: {
          latest: {
            period: {
              start: new Date("2021-01-01T00:00:00.000Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-01-01T00:00:00.000Z"),
            },
            value: "Yasumi",
          },
        },
        owner: {
          latest: {
            period: {
              start: new Date("2021-01-01T00:00:00.000Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-01-01T00:00:00.000Z"),
            },
            value: {
              type: ObjectType.DinoparcUser,
              server: "en.dinoparc.com",
              id: "681579",
              username: "Kapox"
            },
          },
        },
        location: {
          latest: {
            period: {
              start: new Date("2021-01-01T00:00:00.000Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-01-01T00:00:00.000Z"),
            },
            value: "0",
          },
        },
        race: {
          latest: {
            period: {
              start: new Date("2021-01-01T00:00:00.000Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-01-01T00:00:00.000Z"),
            },
            value: "Wanwan",
          },
        },
        skin: {
          latest: {
            period: {
              start: new Date("2021-01-01T00:00:00.000Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-01-01T00:00:00.000Z"),
            },
            value: "Ac9OrgxOWu1pd7Fp",
          },
        },
        life: {
          latest: {
            period: {
              start: new Date("2021-01-01T00:00:00.000Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-01-01T00:00:00.000Z"),
            },
            value: 30,
          },
        },
        level: {
          latest: {
            period: {
              start: new Date("2021-01-01T00:00:00.000Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-01-01T00:00:00.000Z"),
            },
            value: 12,
          },
        },
        experience: {
          latest: {
            period: {
              start: new Date("2021-01-01T00:00:00.000Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-01-01T00:00:00.000Z"),
            },
            value: 13,
          },
        },
        danger: {
          latest: {
            period: {
              start: new Date("2021-01-01T00:00:00.000Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-01-01T00:00:00.000Z"),
            },
            value: 116,
          },
        },
        inTournament: {
          latest: {
            period: {
              start: new Date("2021-01-01T00:00:00.000Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-01-01T00:00:00.000Z"),
            },
            value: false,
          },
        },
        elements: {
          latest: {
            period: {
              start: new Date("2021-01-01T00:00:00.000Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-01-01T00:00:00.000Z"),
            },
            value: {
              fire: 10,
              earth: 0,
              water: 0,
              thunder: 7,
              air: 2,
            },
          },
        },
        skills: {
          latest: {
            period: {
              start: new Date("2021-01-01T00:00:00.000Z"),
              end: null,
            },
            retrieved: {
              latest: new Date("2021-01-01T00:00:00.000Z"),
            },
            value: new Map([
              ["Dexterity", 2],
              ["Intelligence", 5],
              ["MartialArts", 5],
              ["Strength", 5],
            ]),
          },
        },
      }],
    ]),
  );
});
