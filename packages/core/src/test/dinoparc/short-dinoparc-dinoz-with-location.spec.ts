import { ObjectType } from "../../lib/core/object-type.js";
import {
  $ShortDinoparcDinozWithLocation,
  ShortDinoparcDinozWithLocation
} from "../../lib/dinoparc/short-dinoparc-dinoz-with-location.js";
import { registerJsonIoTests } from "../helpers.js";

describe("ShortDinoparcDinozWithLocation", function () {
  registerJsonIoTests<ShortDinoparcDinozWithLocation>(
    $ShortDinoparcDinozWithLocation,
    "core/dinoparc/short-dinoparc-dinoz-with-location",
    new Map([
      ["black-devil", {
        type: ObjectType.DinoparcDinoz,
        server: "dinoparc.com",
        id: "3453835",
        name: "Black Devil",
        location: "1",
      }],
      ["unnamed", {
        type: ObjectType.DinoparcDinoz,
        server: "dinoparc.com",
        id: "3561648",
        name: null,
        location: null,
      }],
    ])
  );
});
