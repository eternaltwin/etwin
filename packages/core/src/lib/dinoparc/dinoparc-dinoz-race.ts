import { $Ucs2String } from "kryo/ucs2-string";
import { WhiteListType } from "kryo/white-list";

/**
 * A Dinoparc dinoz race.
 */
export type DinoparcDinozRace =
  "Cargou"
  | "Castivore"
  | "Gluon"
  | "Gorilloz"
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
    "Gorilloz",
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
