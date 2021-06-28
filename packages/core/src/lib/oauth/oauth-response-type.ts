import { CaseStyle } from "kryo";
import { TsEnumType } from "kryo/lib/ts-enum";

export enum OauthResponseType {
  Code,
  Token
}

export const $OauthResponseType: TsEnumType<OauthResponseType> = new TsEnumType<OauthResponseType>({
  enum: OauthResponseType,
  changeCase: CaseStyle.SnakeCase,
});
