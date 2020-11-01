import { $DinoparcServer } from "@eternal-twin/core/lib/dinoparc/dinoparc-server.js";
import { $DinoparcUsername } from "@eternal-twin/core/lib/dinoparc/dinoparc-username.js";
import { CaseStyle } from "kryo";
import { $Uint32 } from "kryo/lib/integer.js";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TryUnionType } from "kryo/lib/try-union.js";

import { DinoparcContext, DinoparcPlayerInfo } from "../../lib/scraping/context.js";

export const $DinoparcPlayerInfo: RecordIoType<DinoparcPlayerInfo> = new RecordType<DinoparcPlayerInfo>({
  properties: {
    username: {type: $DinoparcUsername},
    money: {type: $Uint32},
  },
  changeCase: CaseStyle.SnakeCase,
});

export const $NullableDinoparcPlayerInfo: TryUnionType<DinoparcPlayerInfo | null> = new TryUnionType({variants: [$Null, $DinoparcPlayerInfo]});

export const $DinoparcContext: RecordIoType<DinoparcContext> = new RecordType<DinoparcContext>({
  properties: {
    server: {type: $DinoparcServer},
    self: {type: $NullableDinoparcPlayerInfo},
  },
  changeCase: CaseStyle.SnakeCase,
});
