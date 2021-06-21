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
            }
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
    ])
  );
});
