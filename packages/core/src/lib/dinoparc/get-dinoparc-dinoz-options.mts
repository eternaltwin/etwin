import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { RecordIoType, RecordType } from "kryo/record";

import { $DinoparcDinozId, DinoparcDinozId } from "./dinoparc-dinoz-id.mjs";
import { $DinoparcServer, DinoparcServer } from "./dinoparc-server.mjs";

export interface GetDinoparcDinozOptions {
  server: DinoparcServer;
  id: DinoparcDinozId;
  time?: Date;
}

export const $GetDinoparcDinozOptions: RecordIoType<GetDinoparcDinozOptions> = new RecordType<GetDinoparcDinozOptions>({
  properties: {
    server: {type: $DinoparcServer},
    id: {type: $DinoparcDinozId},
    time: {type: $Date, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
