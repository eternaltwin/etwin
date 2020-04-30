import { TsEnumType } from "kryo/lib/ts-enum.js";

export enum AuthType {
  /**
   * Unauthenticated
   */
  Guest,

  /**
   * Authenticated as a user.
   */
  User,

  /**
   * System action
   */
  System,
}

export const $AuthType: TsEnumType<AuthType> = new TsEnumType<AuthType>({
  enum: AuthType,
});
