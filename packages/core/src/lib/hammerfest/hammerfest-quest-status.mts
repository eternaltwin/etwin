import { TsEnumType } from "kryo/ts-enum";

export enum HammerfestQuestStatus {
  None,
  Pending,
  Complete,
}

export const $HammerfestQuestStatus: TsEnumType<HammerfestQuestStatus> = new TsEnumType<HammerfestQuestStatus>({
  enum: HammerfestQuestStatus,
});
