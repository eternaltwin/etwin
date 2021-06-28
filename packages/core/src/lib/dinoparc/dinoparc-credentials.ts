import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $DinoparcPassword, DinoparcPassword } from "./dinoparc-password.js";
import { $DinoparcServer, DinoparcServer } from "./dinoparc-server.js";
import { $DinoparcUsername, DinoparcUsername } from "./dinoparc-username.js";

export interface DinoparcCredentials {
  server: DinoparcServer;
  username: DinoparcUsername;
  password: DinoparcPassword;
}

export const $DinoparcCredentials: RecordIoType<DinoparcCredentials> = new RecordType<DinoparcCredentials>({
  properties: {
    server: {type: $DinoparcServer},
    username: {type: $DinoparcUsername},
    password: {type: $DinoparcPassword},
  },
  changeCase: CaseStyle.SnakeCase,
});
