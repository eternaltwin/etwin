import { TsEnumType } from "kryo/ts-enum";

/**
 * The auth scope allows to precise the scope to use when checking authorizations.
 *
 * For example a user may create a token with restricted privileges, or some critical operations may require a fresh
 * strong authentication.
 */
export enum AuthScope {
  Default,
}

export const $AuthScope: TsEnumType<AuthScope> = new TsEnumType<AuthScope>({
  enum: AuthScope,
});
