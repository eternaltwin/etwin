import { $Ucs2String } from "kryo/ucs2-string";
import { WhiteListType } from "kryo/white-list";

/**
 * A Dinoparc server.
 */
export type DinoparcServer = "dinoparc.com" | "en.dinoparc.com" | "sp.dinoparc.com";

export const $DinoparcServer: WhiteListType<DinoparcServer> = new WhiteListType({
  itemType: $Ucs2String,
  values: ["dinoparc.com", "en.dinoparc.com", "sp.dinoparc.com"],
});
