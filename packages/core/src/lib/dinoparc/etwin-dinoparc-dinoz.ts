import { CaseStyle, IoType } from "kryo";
import { $Boolean } from "kryo/lib/boolean.js";
import { $Date } from "kryo/lib/date.js";
import { $Sint16, $Uint8,$Uint16 } from "kryo/lib/integer.js";
import { LiteralType } from "kryo/lib/literal.js";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TryUnionType } from "kryo/lib/try-union.js";
import { $Ucs2String } from "kryo/lib/ucs2-string.js";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $NullableLatestTemporal, NullableLatestTemporal } from "../temporal/latest-temporal.js";
import { $DinoparcDinozElements, DinoparcDinozElements } from "./dinoparc-dinoz-elements.js";
import { $DinoparcDinozId, DinoparcDinozId } from "./dinoparc-dinoz-id.js";
import { $DinoparcDinozName, DinoparcDinozName } from "./dinoparc-dinoz-name.js";
import { $DinoparcDinozRace, DinoparcDinozRace } from "./dinoparc-dinoz-race.js";
import { $DinoparcLocationId, DinoparcLocationId } from "./dinoparc-location-id.js";
import { $DinoparcServer, DinoparcServer } from "./dinoparc-server.js";
import { $DinoparcSkillLevels, DinoparcSkillLevels } from "./dinoparc-skill-levels.js";

export interface EtwinDinoparcDinoz {
  type: ObjectType.DinoparcDinoz;
  server: DinoparcServer;
  id: DinoparcDinozId;
  archivedAt: Date;
  name: NullableLatestTemporal<DinoparcDinozName>;
  location: NullableLatestTemporal<DinoparcLocationId>;
  race: NullableLatestTemporal<DinoparcDinozRace>;
  skin: NullableLatestTemporal<string>;
  life: NullableLatestTemporal<number>;
  level: NullableLatestTemporal<number>;
  experience: NullableLatestTemporal<number>;
  danger: NullableLatestTemporal<number>;
  inTournament: NullableLatestTemporal<boolean>;
  elements: NullableLatestTemporal<DinoparcDinozElements>;
  skills: NullableLatestTemporal<DinoparcSkillLevels>;
}

export const $EtwinDinoparcDinoz: RecordIoType<EtwinDinoparcDinoz> = new RecordType<EtwinDinoparcDinoz>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.DinoparcDinoz})},
    server: {type: $DinoparcServer},
    id: {type: $DinoparcDinozId},
    archivedAt: {type: $Date},
    name: {type: $NullableLatestTemporal.apply($DinoparcDinozName) as IoType<NullableLatestTemporal<DinoparcDinozName>>},
    location: {type: $NullableLatestTemporal.apply($DinoparcLocationId) as IoType<NullableLatestTemporal<DinoparcLocationId>>},
    race: {type: $NullableLatestTemporal.apply($DinoparcDinozRace) as IoType<NullableLatestTemporal<DinoparcDinozRace>>},
    skin: {type: $NullableLatestTemporal.apply($Ucs2String) as IoType<NullableLatestTemporal<string>>},
    life: {type: $NullableLatestTemporal.apply($Uint8) as IoType<NullableLatestTemporal<number>>},
    level: {type: $NullableLatestTemporal.apply($Uint16) as IoType<NullableLatestTemporal<number>>},
    experience: {type: $NullableLatestTemporal.apply($Uint8) as IoType<NullableLatestTemporal<number>>},
    danger: {type: $NullableLatestTemporal.apply($Sint16) as IoType<NullableLatestTemporal<number>>},
    inTournament: {type: $NullableLatestTemporal.apply($Boolean) as IoType<NullableLatestTemporal<boolean>>},
    elements: {type: $NullableLatestTemporal.apply($DinoparcDinozElements) as IoType<NullableLatestTemporal<DinoparcDinozElements>>},
    skills: {type: $NullableLatestTemporal.apply($DinoparcSkillLevels) as IoType<NullableLatestTemporal<DinoparcSkillLevels>>},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableEtwinDinoparcDinoz = null | EtwinDinoparcDinoz;

export const $NullableEtwinDinoparcDinoz: TryUnionType<NullableEtwinDinoparcDinoz> = new TryUnionType({variants: [$Null, $EtwinDinoparcDinoz]});
