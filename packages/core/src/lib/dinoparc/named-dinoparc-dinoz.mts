import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/boolean";
import { $Sint16, $Uint8,$Uint16 } from "kryo/integer";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";
import { $Ucs2String } from "kryo/ucs2-string";

import { $ObjectType, ObjectType } from "../core/object-type.mjs";
import { $DinoparcDinozElements, DinoparcDinozElements } from "./dinoparc-dinoz-elements.mjs";
import { $DinoparcDinozId, DinoparcDinozId } from "./dinoparc-dinoz-id.mjs";
import { $DinoparcDinozName, DinoparcDinozName } from "./dinoparc-dinoz-name.mjs";
import { $DinoparcDinozRace, DinoparcDinozRace } from "./dinoparc-dinoz-race.mjs";
import { $DinoparcLocationId, DinoparcLocationId } from "./dinoparc-location-id.mjs";
import { $DinoparcServer, DinoparcServer } from "./dinoparc-server.mjs";
import { $DinoparcSkillLevels, DinoparcSkillLevels } from "./dinoparc-skill-levels.mjs";

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
