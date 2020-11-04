import { CaseStyle } from "kryo";
import { TsEnumType } from "kryo/lib/ts-enum.js";

export enum OauthTokenType {
  Bearer,
}

// TODO: Case-insensitive deserialization
export const $OauthTokenType: TsEnumType<OauthTokenType> = new TsEnumType<OauthTokenType>({
  enum: OauthTokenType,
  changeCase: CaseStyle.PascalCase,
});
