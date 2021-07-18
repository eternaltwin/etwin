import { ObjectType } from "../../lib/core/object-type.js";
import { $DinoparcDinozResponse, DinoparcDinozResponse } from "../../lib/dinoparc/dinoparc-dinoz-response.js";
import { registerJsonIoTests } from "../helpers.js";

describe("DinoparcDinozResponse", function () {
  registerJsonIoTests<DinoparcDinozResponse>(
    $DinoparcDinozResponse,
    "core/dinoparc/dinoparc-dinoz-response",
    new Map([
      ["boreo", {
        sessionUser: {
          user: {
            type: ObjectType.DinoparcUser,
            server: "dinoparc.com",
            id: "2408723",
            username: "demurgos",
          },
          coins: 2000,
          dinoz: [
            {
              type: ObjectType.DinoparcDinoz,
              server: "dinoparc.com",
              id: "3749448",
              name: "Boréo",
              location: "0",
            },
          ],
        },
        dinoz: {
          type: ObjectType.DinoparcDinoz,
          server: "dinoparc.com",
          id: "3749448",
          name: "Boréo",
          location: "0",
          race: "Pteroz",
          skin: "DrQT9bHipH7wBkBt",
          life: 100,
          level: 1,
          experience: 0,
          danger: 0,
          inTournament: false,
          elements: {
            fire: 1,
            earth: 1,
            water: 0,
            thunder: 3,
            air: 6
          },
          skills: new Map([
            ["Dexterity", 2],
            ["Intelligence", 3],
            ["Strength", 1],
            ["Dig", 1],
          ]),
        }
      }],
      ["unnamed", {
        sessionUser: {
          user: {
            type: ObjectType.DinoparcUser,
            server: "dinoparc.com",
            id: "205944",
            username: "djtoph",
          },
          coins: 2405,
          dinoz: [
            {
              type: ObjectType.DinoparcDinoz,
              server: "dinoparc.com",
              id: "1095080",
              name: "boutchou",
              location: "7",
            },
            {
              type: ObjectType.DinoparcDinoz,
              server: "dinoparc.com",
              id: "1162336",
              name: "jo le dino",
              location: "0",
            },
            {
              type: ObjectType.DinoparcDinoz,
              server: "dinoparc.com",
              id: "2094149",
              name: "Blue Devil",
              location: "10",
            },
            {
              type: ObjectType.DinoparcDinoz,
              server: "dinoparc.com",
              id: "2589135",
              name: "Green Devil",
              location: "8",
            },
            {
              type: ObjectType.DinoparcDinoz,
              server: "dinoparc.com",
              id: "3081875",
              name: "Stewie",
              location: "13",
            },
            {
              type: ObjectType.DinoparcDinoz,
              server: "dinoparc.com",
              id: "3248685",
              name: "Aequity",
              location: "0",
            },
            {
              type: ObjectType.DinoparcDinoz,
              server: "dinoparc.com",
              id: "3453835",
              name: "Black Devil",
              location: "0",
            },
            {
              type: ObjectType.DinoparcDinoz,
              server: "dinoparc.com",
              id: "3561648",
              name: null,
              location: null,
            },
            {
              type: ObjectType.DinoparcDinoz,
              server: "dinoparc.com",
              id: "3684322",
              name: "Dreamer",
              location: "1",
            },
            {
              type: ObjectType.DinoparcDinoz,
              server: "dinoparc.com",
              id: "3685541",
              name: "Spyrit",
              location: "0",
            },
            {
              type: ObjectType.DinoparcDinoz,
              server: "dinoparc.com",
              id: "3741964",
              name: "Salazar",
              location: "15",
            },
            {
              type: ObjectType.DinoparcDinoz,
              server: "dinoparc.com",
              id: "3749415",
              name: "Nabaku",
              location: "3",
            },
          ],
        },
        dinoz: {
          type: ObjectType.DinoparcDinoz,
          server: "dinoparc.com",
          id: "3561648",
          race: "Cargou",
          skin: "6eLfXvvKAabR6TNY",
          level: 1,
        }
      }],
    ])
  );
});
