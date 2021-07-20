import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $DinoparcDinoz, DinoparcDinoz } from "./dinoparc-dinoz.js";
import { $DinoparcSessionUser, DinoparcSessionUser } from "./dinoparc-session-user.js";

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
