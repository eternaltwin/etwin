import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $DinoparcDinozId, DinoparcDinozId } from "./dinoparc-dinoz-id.js";
import { $DinoparcServer, DinoparcServer } from "./dinoparc-server.js";

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
