import { CaseStyle } from "kryo";
import { $Uint16 } from "kryo/lib/integer";
import { RecordIoType, RecordType } from "kryo/lib/record";

export interface DinoparcDinozElements {
  fire: number,
  earth: number,
  water: number,
  thunder: number,
  air: number,
}

export const $DinoparcDinozElements: RecordIoType<DinoparcDinozElements> = new RecordType<DinoparcDinozElements>({
  properties: {
    fire: {type: $Uint16},
    earth: {type: $Uint16},
    water: {type: $Uint16},
    thunder: {type: $Uint16},
    air: {type: $Uint16},
  },
  changeCase: CaseStyle.SnakeCase,
});
