import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";
import { SetType } from "kryo/set";

import { $DinoparcEpicRewardKey, DinoparcEpicRewardKey } from "./dinoparc-epic-reward-key.mjs";
import { $DinoparcRewardId, DinoparcRewardId } from "./dinoparc-reward-id.mjs";

export interface DinoparcCollection {
  rewards: Set<DinoparcRewardId>,
  epicRewards: Set<DinoparcEpicRewardKey>,
}

export const $DinoparcCollection: RecordIoType<DinoparcCollection> = new RecordType<DinoparcCollection>({
  properties: {
    rewards: {type: new SetType({itemType: $DinoparcRewardId, maxSize: 49})},
    epicRewards: {type: new SetType({itemType: $DinoparcEpicRewardKey, maxSize: 1000})},
  },
  changeCase: CaseStyle.SnakeCase,
});
