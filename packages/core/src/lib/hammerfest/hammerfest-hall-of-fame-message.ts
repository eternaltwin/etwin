import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date";
import { $Null } from "kryo/lib/null";
import { RecordIoType, RecordType } from "kryo/lib/record";
import { TryUnionType } from "kryo/lib/try-union";
import { $Ucs2String } from "kryo/lib/ucs2-string";

export interface HammerfestHallOfFameMessage {
  date: Date;
  message: string;
}

export const $HammerfestHallOfFameMessage: RecordIoType<HammerfestHallOfFameMessage> = new RecordType<HammerfestHallOfFameMessage>({
  properties: {
    date: {type: $Date},
    message: {type: $Ucs2String},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableHammerfestHallOfFameMessage = null | HammerfestHallOfFameMessage;

export const $NullableHammerfestHallOfFameMessage: TryUnionType<NullableHammerfestHallOfFameMessage> = new TryUnionType({variants: [$Null, $HammerfestHallOfFameMessage]});
