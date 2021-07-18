import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/lib/boolean";
import { $Sint16, $Uint8,$Uint16 } from "kryo/lib/integer";
import { LiteralType } from "kryo/lib/literal";
import { RecordIoType, RecordType } from "kryo/lib/record";
import { $Ucs2String } from "kryo/lib/ucs2-string";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $DinoparcDinozElements, DinoparcDinozElements } from "./dinoparc-dinoz-elements.js";
import { $DinoparcDinozId, DinoparcDinozId } from "./dinoparc-dinoz-id.js";
import { $DinoparcDinozName, DinoparcDinozName } from "./dinoparc-dinoz-name.js";
import { $DinoparcDinozRace, DinoparcDinozRace } from "./dinoparc-dinoz-race.js";
import { $DinoparcLocationId, DinoparcLocationId } from "./dinoparc-location-id.js";
import { $DinoparcServer, DinoparcServer } from "./dinoparc-server.js";
import { $DinoparcSkillLevels, DinoparcSkillLevels } from "./dinoparc-skill-levels.js";

export interface NamedDinoparcDinoz {
  type: ObjectType.DinoparcDinoz;
  server: DinoparcServer;
  id: DinoparcDinozId;
  name: DinoparcDinozName;
  location: DinoparcLocationId;
  race: DinoparcDinozRace;
  skin: string;
  life: number;
  level: number;
  experience: number;
  danger: number;
  inTournament: boolean;
  elements: DinoparcDinozElements;
  skills: DinoparcSkillLevels;
}

export const $NamedDinoparcDinoz: RecordIoType<NamedDinoparcDinoz> = new RecordType<NamedDinoparcDinoz>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.DinoparcDinoz})},
    server: {type: $DinoparcServer},
    id: {type: $DinoparcDinozId},
    name: {type: $DinoparcDinozName},
    location: {type: $DinoparcLocationId},
    race: {type: $DinoparcDinozRace},
    skin: {type: $Ucs2String},
    life: {type: $Uint8},
    level: {type: $Uint16},
    experience: {type: $Uint8},
    danger: {type: $Sint16},
    inTournament: {type: $Boolean},
    elements: {type: $DinoparcDinozElements},
    skills: {type: $DinoparcSkillLevels},
  },
  changeCase: CaseStyle.SnakeCase,
});
