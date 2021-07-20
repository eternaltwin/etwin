import { CaseStyle } from "kryo";
import { TsEnumType } from "kryo/ts-enum";

export enum OauthResponseType {
  Code,
  Token
}

export const $OauthResponseType: TsEnumType<OauthResponseType> = new TsEnumType<OauthResponseType>({
  enum: OauthResponseType,
  changeCase: CaseStyle.SnakeCase,
});
