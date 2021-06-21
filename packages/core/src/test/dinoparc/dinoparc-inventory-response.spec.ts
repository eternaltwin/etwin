import { ObjectType } from "../../lib/core/object-type.js";
import { $DinoparcInventoryResponse, DinoparcInventoryResponse } from "../../lib/dinoparc/dinoparc-inventory-response.js";
import { registerJsonIoTests } from "../helpers.js";

describe("DinoparcInventoryResponse", function () {
  registerJsonIoTests<DinoparcInventoryResponse>(
    $DinoparcInventoryResponse,
    "core/dinoparc/dinoparc-inventory-response",
    new Map([
      ["demurgos", {
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
        inventory: new Map([
          ["1", 3],
          ["3", 2],
        ]),
      }],
    ])
  );
});
