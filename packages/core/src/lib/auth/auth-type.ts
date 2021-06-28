import { TsEnumType } from "kryo/lib/ts-enum";

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
   * Authenticated as an oauth client application.
   *
   * This represents a request from the client itself, not on behalf of a user.
   */
  OauthClient,

  /**
   * Authenticated as a user, accessed from an OAuth client.
   */
  AccessToken,

  /**
   * System action
   */
  System,
}

export const $AuthType: TsEnumType<AuthType> = new TsEnumType<AuthType>({
  enum: AuthType,
});
