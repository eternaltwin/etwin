import { TsEnumType } from "kryo/ts-enum";

/**
 * Tag identifying the login types.
 */
export enum LoginType {
  Uuid,
  Email,
  Username,
  UserId,
  OauthClientId,
  OauthClientKey,
}

export const $LoginType: TsEnumType<LoginType> = new TsEnumType<LoginType>({
  enum: LoginType,
});
