import { TsEnumType } from "kryo/lib/ts-enum";

export enum OauthTokenType {
  Bearer,
}

export const $OauthTokenType: TsEnumType<OauthTokenType> = new TsEnumType<OauthTokenType>({
  enum: OauthTokenType,
});
