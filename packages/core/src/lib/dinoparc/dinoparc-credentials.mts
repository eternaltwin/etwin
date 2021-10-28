import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $DinoparcPassword, DinoparcPassword } from "./dinoparc-password.mjs";
import { $DinoparcServer, DinoparcServer } from "./dinoparc-server.mjs";
import { $DinoparcUsername, DinoparcUsername } from "./dinoparc-username.mjs";

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
