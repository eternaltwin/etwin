import { $DinoparcServer, DinoparcServer } from "../../lib/dinoparc/dinoparc-server.mjs";
import { registerJsonIoTests } from "../helpers.mjs";

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
