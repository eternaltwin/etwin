import { CaseStyle } from "kryo";
import { $Uint16 } from "kryo/integer";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";
import { $Ucs2String } from "kryo/ucs2-string";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $DinoparcDinozId, DinoparcDinozId } from "./dinoparc-dinoz-id.js";
import { $DinoparcDinozRace, DinoparcDinozRace } from "./dinoparc-dinoz-race.js";
import { $DinoparcServer, DinoparcServer } from "./dinoparc-server.js";

export interface UnnamedDinoparcDinoz {
  type: ObjectType.DinoparcDinoz;
  server: DinoparcServer;
  id: DinoparcDinozId;
  race: DinoparcDinozRace;
  skin: string;
  level: number;
  name?: null;
}

export const $UnnamedDinoparcDinoz: RecordIoType<UnnamedDinoparcDinoz> = new RecordType<UnnamedDinoparcDinoz>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.DinoparcDinoz})},
    server: {type: $DinoparcServer},
    id: {type: $DinoparcDinozId},
    race: {type: $DinoparcDinozRace},
    skin: {type: $Ucs2String},
    level: {type: $Uint16},
  },
  changeCase: CaseStyle.SnakeCase,
});
