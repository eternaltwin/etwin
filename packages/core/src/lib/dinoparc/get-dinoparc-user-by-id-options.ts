import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $DinoparcServer, DinoparcServer } from "./dinoparc-server.js";
import { $DinoparcUserId, DinoparcUserId } from "./dinoparc-user-id.js";

export interface GetDinoparcUserByIdOptions {
  server: DinoparcServer;
  id: DinoparcUserId;
  time?: Date;
}

export const $GetHammerfestUserByIdOptions: RecordIoType<GetDinoparcUserByIdOptions> = new RecordType<GetDinoparcUserByIdOptions>({
  properties: {
    server: {type: $DinoparcServer},
    id: {type: $DinoparcUserId},
    time: {type: $Date, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
