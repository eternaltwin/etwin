import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $DinoparcDinozId, DinoparcDinozId } from "./dinoparc-dinoz-id.js";
import { $DinoparcDinozName, DinoparcDinozName } from "./dinoparc-dinoz-name.js";
import { $DinoparcLocationId, DinoparcLocationId } from "./dinoparc-location-id.js";
import { $DinoparcServer, DinoparcServer } from "./dinoparc-server.js";

export interface ShortDinoparcDinozWithLocation {
  type: ObjectType.DinoparcDinoz;
  server: DinoparcServer;
  id: DinoparcDinozId;
  name: DinoparcDinozName;
  location: DinoparcLocationId;
}

export const $ShortDinoparcDinozWithLocation: RecordIoType<ShortDinoparcDinozWithLocation> = new RecordType<ShortDinoparcDinozWithLocation>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.DinoparcDinoz})},
    server: {type: $DinoparcServer},
    id: {type: $DinoparcDinozId},
    name: {type: $DinoparcDinozName},
    location: {type: $DinoparcLocationId},
  },
  changeCase: CaseStyle.SnakeCase,
});
