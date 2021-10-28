import { $Uint32 } from "kryo/integer";
import { MapType } from "kryo/map";

import { $DinoparcSkill, DinoparcSkill } from "./dinoparc-skill.mjs";

export type DinoparcSkillLevels = Map<DinoparcSkill, number>;

export const $DinoparcSkillLevels: MapType<DinoparcSkill, number> = new MapType({
  keyType: $DinoparcSkill,
  valueType: $Uint32,
  maxSize: 1000,
  assumeStringKey: true,
});
