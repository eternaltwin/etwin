import { TsEnumType } from "kryo/lib/ts-enum.js";

export enum HammerfestQuestStatus {
  None,
  Pending,
  Complete,
}

export const $HammerfestQuestStatus: TsEnumType<HammerfestQuestStatus> = new TsEnumType<HammerfestQuestStatus>({
  enum: HammerfestQuestStatus,
});
