import { ObjectType } from "../../lib/core/object-type.mjs";
import {
  $ShortDinoparcDinozWithLevel,
  ShortDinoparcDinozWithLevel
} from "../../lib/dinoparc/short-dinoparc-dinoz-with-level.mjs";
import { registerJsonIoTests } from "../helpers.mjs";

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
