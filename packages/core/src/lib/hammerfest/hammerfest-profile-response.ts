import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $NullableHammerfestProfile, NullableHammerfestProfile } from "./hammerfest-profile.js";
import {
  $NullableHammerfestSessionUser,
  NullableHammerfestSessionUser
} from "./hammerfest-session-user.js";

export interface HammerfestProfileResponse {
  session: NullableHammerfestSessionUser;
  profile: NullableHammerfestProfile;
}

export const $HammerfestProfileResponse: RecordIoType<HammerfestProfileResponse> = new RecordType<HammerfestProfileResponse>({
  properties: {
    session: {type: $NullableHammerfestSessionUser},
    profile: {type: $NullableHammerfestProfile},
  },
  changeCase: CaseStyle.SnakeCase,
});
