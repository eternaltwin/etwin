import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $UpdateStoreUserPatch, UpdateStoreUserPatch } from "./update-store-user-patch.mjs";
import { $UserIdRef, UserIdRef } from "./user-id-ref.mjs";

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
