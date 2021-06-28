import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $UpdateStoreUserPatch, UpdateStoreUserPatch } from "./update-store-user-patch.js";
import { $UserIdRef, UserIdRef } from "./user-id-ref.js";

export interface UpdateStoreUserOptions {
  ref: UserIdRef;
  actor: UserIdRef;
  patch: UpdateStoreUserPatch;
}

export const $UpdateStoreUserOptions: RecordIoType<UpdateStoreUserOptions> = new RecordType<UpdateStoreUserOptions>({
  properties: {
    ref: {type: $UserIdRef},
    actor: {type: $UserIdRef},
    patch: {type: $UpdateStoreUserPatch},
  },
  changeCase: CaseStyle.SnakeCase,
});
