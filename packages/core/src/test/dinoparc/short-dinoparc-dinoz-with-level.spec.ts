import { ObjectType } from "../../lib/core/object-type.js";
import {
  $ShortDinoparcDinozWithLevel,
  ShortDinoparcDinozWithLevel
} from "../../lib/dinoparc/short-dinoparc-dinoz-with-level.js";
import { registerJsonIoTests } from "../helpers.js";

describe("ShortDinoparcDinozWithLevel", function () {
  registerJsonIoTests<ShortDinoparcDinozWithLevel>(
    $ShortDinoparcDinozWithLevel,
    "core/dinoparc/short-dinoparc-dinoz-with-level",
    new Map([
      ["black-devil", {
        type: ObjectType.DinoparcDinoz,
        server: "dinoparc.com",
        id: "3453835",
        name: "Black Devil",
        level: 288,
      }],
      ["unnamed", {
        type: ObjectType.DinoparcDinoz,
        server: "dinoparc.com",
        id: "3561648",
        name: null,
        level: 1,
      }],
    ])
  );
});
