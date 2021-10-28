import { TsEnumType } from "kryo/ts-enum";

export enum HammerfestForumRole {
  None,
  Moderator,
  Administrator,
}

export const $HammerfestForumRole: TsEnumType<HammerfestForumRole> = new TsEnumType<HammerfestForumRole>({
  enum: HammerfestForumRole,
});
