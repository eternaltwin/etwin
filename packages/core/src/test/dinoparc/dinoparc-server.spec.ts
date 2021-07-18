import { $DinoparcServer, DinoparcServer } from "../../lib/dinoparc/dinoparc-server.js";
import { registerJsonIoTests } from "../helpers.js";

describe("DinoparcServer", function () {
  registerJsonIoTests<DinoparcServer>(
    $DinoparcServer,
    "core/dinoparc/dinoparc-server",
    new Map([
      ["en", "en.dinoparc.com"],
      ["main", "dinoparc.com"],
      ["sp", "sp.dinoparc.com"],
    ])
  );
});
