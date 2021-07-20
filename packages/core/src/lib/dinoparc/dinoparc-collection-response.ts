import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $DinoparcCollection, DinoparcCollection } from "./dinoparc-collection.js";
import { $DinoparcSessionUser, DinoparcSessionUser } from "./dinoparc-session-user.js";

export interface DinoparcCollectionResponse {
  sessionUser: DinoparcSessionUser;
  collection: DinoparcCollection;
}

export const $DinoparcCollectionResponse: RecordIoType<DinoparcCollectionResponse> = new RecordType<DinoparcCollectionResponse>({
  properties: {
    sessionUser: {type: $DinoparcSessionUser},
    collection: {type: $DinoparcCollection},
  },
  changeCase: CaseStyle.SnakeCase,
});
