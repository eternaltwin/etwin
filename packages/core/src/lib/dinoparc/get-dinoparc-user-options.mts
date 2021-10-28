import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { RecordIoType, RecordType } from "kryo/record";

import { $DinoparcServer, DinoparcServer } from "./dinoparc-server.mjs";
import { $DinoparcUserId, DinoparcUserId } from "./dinoparc-user-id.mjs";

export interface GetDinoparcUserOptions {
  server: DinoparcServer;
  id: DinoparcUserId;
  time?: Date;
}

export const $GetDinoparcUserOptions: RecordIoType<GetDinoparcUserOptions> = new RecordType<GetDinoparcUserOptions>({
  properties: {
    server: {type: $DinoparcServer},
    id: {type: $DinoparcUserId},
    time: {type: $Date, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
