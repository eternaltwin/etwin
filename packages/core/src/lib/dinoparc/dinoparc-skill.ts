import { $Ucs2String } from "kryo/lib/ucs2-string";
import { WhiteListType } from "kryo/lib/white-list";

/**
 * A Dinoparc skill.
 */
export type DinoparcSkill =
  | "Bargain"
  | "Camouflage"
  | "Climb"
  | "Cook"
  | "Counterattack"
  | "Dexterity"
  | "Dig"
  | "EarthApprentice"
  | "FireApprentice"
  | "FireProtection"
  | "Intelligence"
  | "Juggle"
  | "Jump"
  | "Luck"
  | "MartialArts"
  | "Medicine"
  | "Mercenary"
  | "Music"
  | "Navigation"
  | "Perception"
  | "Provoke"
  | "Run"
  | "Saboteur"
  | "ShadowPower"
  | "Spy"
  | "Stamina"
  | "Steal"
  | "Strategy"
  | "Strength"
  | "Survival"
  | "Swim"
  | "ThunderApprentice"
  | "TotemThief"
  | "WaterApprentice";

export const $DinoparcSkill: WhiteListType<DinoparcSkill> = new WhiteListType({
  itemType: $Ucs2String,
  values: [
    "Bargain",
    "Camouflage",
    "Climb",
    "Cook",
    "Counterattack",
    "Dexterity",
    "Dig",
    "EarthApprentice",
    "FireApprentice",
    "FireProtection",
    "Intelligence",
    "Juggle",
    "Jump",
    "Luck",
    "MartialArts",
    "Medicine",
    "Mercenary",
    "Music",
    "Navigation",
    "Perception",
    "Provoke",
    "Run",
    "Saboteur",
    "ShadowPower",
    "Spy",
    "Stamina",
    "Steal",
    "Strategy",
    "Strength",
    "Survival",
    "Swim",
    "ThunderApprentice",
    "TotemThief",
    "WaterApprentice",
  ]
});
