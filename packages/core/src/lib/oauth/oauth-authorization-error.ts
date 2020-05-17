import { CaseStyle } from "kryo";
import { TsEnumType } from "kryo/lib/ts-enum.js";

export enum OauthAuthorizationError {
  /**
   * > The request is missing a required parameter, includes an
   * > invalid parameter value, includes a parameter more than
   * > once, or is otherwise malformed.
   */
  InvalidRequest,

  /**
   * > The client is not authorized to request an authorization
   * > code using this method.
   */
  UnauthorizedClient,

  /**
   * > The resource owner or authorization server denied the
   * > request.
   */
  AccessDenied,

  /**
   * > The authorization server does not support obtaining an
   * > authorization code using this method.
   */
  UnsupportedResponseType,

  /**
   * > The requested scope is invalid, unknown, or malformed.
   */
  InvalidScope,

  /**
   * > The authorization server encountered an unexpected
   * > condition that prevented it from fulfilling the request.
   * > (This error code is needed because a 500 Internal Server
   * > Error HTTP status code cannot be returned to the client
   * > via an HTTP redirect.)
   */
  ScopeError,

  /**
   * > The authorization server is currently unable to handle
   * > the request due to a temporary overloading or maintenance
   * > of the server.  (This error code is needed because a 503
   * > Service Unavailable HTTP status code cannot be returned
   * > to the client via an HTTP redirect.)
   */
  TemporarilyUnavailable,
}

export const $OauthAuthorizationError: TsEnumType<OauthAuthorizationError> = new TsEnumType<OauthAuthorizationError>({
  enum: OauthAuthorizationError,
  changeCase: CaseStyle.SnakeCase,
});
