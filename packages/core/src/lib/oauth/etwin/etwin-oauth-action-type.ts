import { TsEnumType } from "kryo/ts-enum";

/**
 * Action type associated to an OAuth state.
 */
export enum EtwinOauthActionType {
  /**
   * Authenticate a user through Oauth
   */
  Login,

  /**
   * Link a remote user
   */
  Link,
}

export const $EtwinOauthActionType: TsEnumType<EtwinOauthActionType> = new TsEnumType<EtwinOauthActionType>({
  enum: EtwinOauthActionType,
});
