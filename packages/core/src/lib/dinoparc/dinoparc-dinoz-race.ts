import { $Ucs2String } from "kryo/lib/ucs2-string.js";
import { WhiteListType } from "kryo/lib/white-list.js";

/**
 * A Dinoparc dinoz race.
 */
export type DinoparcDinozRace =
  "Cargou"
  | "Castivore"
  | "Gluon"
  | "Gorriloz"
  | "Hippoclamp"
  | "Kabuki"
  | "Korgon"
  | "Kump"
  | "Moueffe"
  | "Ouistiti"
  | "Picori"
  | "Pigmou"
  | "Pteroz"
  | "Rokky"
  | "Santaz"
  | "Serpantin"
  | "Sirain"
  | "Wanwan"
  | "Winks";

export const $DinoparcDinozRace: WhiteListType<DinoparcDinozRace> = new WhiteListType({
  itemType: $Ucs2String,
  values: [
    "Cargou",
    "Castivore",
    "Gluon",
    "Gorriloz",
    "Hippoclamp",
    "Kabuki",
    "Korgon",
    "Kump",
    "Moueffe",
    "Ouistiti",
    "Picori",
    "Pigmou",
    "Pteroz",
    "Rokky",
    "Santaz",
    "Serpantin",
    "Sirain",
    "Wanwan",
    "Winks",
  ]
});
