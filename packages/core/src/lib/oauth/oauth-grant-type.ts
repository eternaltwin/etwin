import { CaseStyle } from "kryo";
import { TsEnumType } from "kryo/lib/ts-enum.js";

export enum OauthGrantType {
  AuthorizationCode,
}

export const $OauthGrantType: TsEnumType<OauthGrantType> = new TsEnumType<OauthGrantType>({
  enum: OauthGrantType,
  changeCase: CaseStyle.SnakeCase,
});
