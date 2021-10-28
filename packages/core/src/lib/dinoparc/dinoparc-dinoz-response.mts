import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $DinoparcDinoz, DinoparcDinoz } from "./dinoparc-dinoz.mjs";
import { $DinoparcSessionUser, DinoparcSessionUser } from "./dinoparc-session-user.mjs";

export interface DinoparcDinozResponse {
  sessionUser: DinoparcSessionUser;
  dinoz: DinoparcDinoz;
}

export const $DinoparcDinozResponse: RecordIoType<DinoparcDinozResponse> = new RecordType<DinoparcDinozResponse>({
  properties: {
    sessionUser: {type: $DinoparcSessionUser},
    dinoz: {type: $DinoparcDinoz},
  },
  changeCase: CaseStyle.SnakeCase,
});
