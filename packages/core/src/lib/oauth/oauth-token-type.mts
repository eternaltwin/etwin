import { CaseStyle } from "kryo";
import { TsEnumType } from "kryo/ts-enum";

export enum OauthTokenType {
  Bearer,
}

// TODO: Case-insensitive deserialization
export const $OauthTokenType: TsEnumType<OauthTokenType> = new TsEnumType<OauthTokenType>({
  enum: OauthTokenType,
  changeCase: CaseStyle.PascalCase,
});
