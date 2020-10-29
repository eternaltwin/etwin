import { TsEnumType } from "kryo/lib/ts-enum.js";

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
