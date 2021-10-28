import { $AuthContext, AuthContext } from "@eternal-twin/core/auth/auth-context";
import {
  $CreateAccessTokenOptions,
  CreateAccessTokenOptions
} from "@eternal-twin/core/auth/create-access-token-options";
import { $Credentials, Credentials } from "@eternal-twin/core/auth/credentials";
import {
  $RegisterOrLoginWithEmailOptions,
  RegisterOrLoginWithEmailOptions
} from "@eternal-twin/core/auth/register-or-login-with-email-options";
import {
  $RegisterWithUsernameOptions,
  RegisterWithUsernameOptions
} from "@eternal-twin/core/auth/register-with-username-options";
import {
  $RegisterWithVerifiedEmailOptions,
  RegisterWithVerifiedEmailOptions
} from "@eternal-twin/core/auth/register-with-verified-email-options";
import { AuthService } from "@eternal-twin/core/auth/service";
import { $SessionId, SessionId } from "@eternal-twin/core/auth/session-id";
import { $NullableUserAndSession, $UserAndSession, UserAndSession } from "@eternal-twin/core/auth/user-and-session";
import { $UserCredentials, UserCredentials } from "@eternal-twin/core/auth/user-credentials";
import { $DinoparcCredentials, DinoparcCredentials } from "@eternal-twin/core/dinoparc/dinoparc-credentials";
import {
  $HammerfestCredentials,
  HammerfestCredentials
} from "@eternal-twin/core/hammerfest/hammerfest-credentials";
import {
  $EtwinOauthAccessTokenKey,
  EtwinOauthAccessTokenKey
} from "@eternal-twin/core/oauth/etwin-oauth-access-token-key";
import {
  $GrantOauthAuthorizationOptions,
  GrantOauthAuthorizationOptions
} from "@eternal-twin/core/oauth/grant-oauth-authorization-options";
import { $OauthAccessToken, OauthAccessToken } from "@eternal-twin/core/oauth/oauth-access-token";
import {
  $RfcOauthAccessTokenKey,
  RfcOauthAccessTokenKey
} from "@eternal-twin/core/oauth/rfc-oauth-access-token-key";
import { JSON_READER } from "kryo-json/json-reader";
import { JSON_WRITER } from "kryo-json/json-writer";
import { promisify } from "util";

import native from "#native";

import { NativeAuthStore } from "../auth-store.mjs";
import { NativeClock } from "../clock.mjs";
import { NativeDinoparcClient } from "../dinoparc-client.mjs";
import { NativeDinoparcStore } from "../dinoparc-store.mjs";
import { NativeEmailFormatter } from "../email-formatter.mjs";
import { NativeHammerfestClient } from "../hammerfest-client.mjs";
import { NativeHammerfestStore } from "../hammerfest-store.mjs";
import { NativeLinkStore } from "../link-store.mjs";
import { NativeMailer } from "../mailer.mjs";
import { NativeOauthProviderStore } from "../oauth-provider-store.mjs";
import { NativePasswordService } from "../password.mjs";
import { NativeTwinoidClient } from "../twinoid-client.mjs";
import { NativeTwinoidStore } from "../twinoid-store.mjs";
import { NativeUserStore } from "../user-store.mjs";
import { NativeUuidGenerator } from "../uuid.mjs";

declare const HtmlEmailFormatterBox: unique symbol;
declare const JsonEmailFormatterBox: unique symbol;
export type NativeEmailFormatterBox = typeof HtmlEmailFormatterBox | typeof JsonEmailFormatterBox;

export interface NativeAuthServiceOptions {
  authStore: NativeAuthStore;
  clock: NativeClock;
  dinoparcClient: NativeDinoparcClient;
  dinoparcStore: NativeDinoparcStore;
  emailFormatter: NativeEmailFormatter;
  hammerfestClient: NativeHammerfestClient;
  hammerfestStore: NativeHammerfestStore;
  linkStore: NativeLinkStore;
  mailer: NativeMailer;
  oauthProviderStore: NativeOauthProviderStore;
  passwordService: NativePasswordService;
  userStore: NativeUserStore;
  twinoidClient: NativeTwinoidClient;
  twinoidStore: NativeTwinoidStore;
  uuidGenerator: NativeUuidGenerator;
  authSecret: Uint8Array;
}

export class NativeAuthService implements AuthService {
  private static NEW = promisify(native.services.auth.new);
  private static AUTHENTICATE_ACCESS_TOKEN = promisify(native.services.auth.authenticateAccessToken);
  private static GRANT_OAUTH_AUTHORIZATION = promisify(native.services.auth.grantOauthAuthorization);
  private static CREATE_ACCESS_TOKEN = promisify(native.services.auth.createAccessToken);
  private static REGISTER_OR_LOGIN_WITH_EMAIL = promisify(native.services.auth.registerOrLoginWithEmail);
  private static REGISTER_WITH_VERIFIED_EMAIL = promisify(native.services.auth.registerWithVerifiedEmail);
  private static REGISTER_WITH_USERNAME = promisify(native.services.auth.registerWithUsername);
  private static RAW_LOGIN_WITH_CREDENTIALS = promisify(native.services.auth.rawLoginWithCredentials);
  private static REGISTER_OR_LOGIN_WITH_DINOPARC = promisify(native.services.auth.registerOrLoginWithDinoparc);
  private static REGISTER_OR_LOGIN_WITH_HAMMERFEST = promisify(native.services.auth.registerOrLoginWithHammerfest);
  private static REGISTER_OR_LOGIN_WITH_TWINOID_OAUTH = promisify(native.services.auth.registerOrLoginWithTwinoidOauth);
  private static AUTHENTICATE_SESSION = promisify(native.services.auth.authenticateSession);
  private static RAW_AUTHENTICATE_CREDENTIALS = promisify(native.services.auth.rawAuthenticateCredentials);

  public readonly box: NativeEmailFormatterBox;

  private constructor(box: NativeEmailFormatterBox) {
    this.box = box;
  }

  static async create(options: Readonly<NativeAuthServiceOptions>): Promise<NativeAuthService> {
    return new NativeAuthService(await NativeAuthService.NEW(
      options.authStore.box,
      options.clock.box,
      options.dinoparcClient.box,
      options.dinoparcStore.box,
      options.emailFormatter.box,
      options.hammerfestClient.box,
      options.hammerfestStore.box,
      options.linkStore.box,
      options.mailer.box,
      options.oauthProviderStore.box,
      options.passwordService.box,
      options.userStore.box,
      options.twinoidClient.box,
      options.twinoidStore.box,
      options.uuidGenerator.box,
      options.authSecret,
    ));
  }

  async authenticateAccessToken(token: EtwinOauthAccessTokenKey): Promise<AuthContext> {
    const rawToken: string = $EtwinOauthAccessTokenKey.write(JSON_WRITER, token);
    const rawOut = await NativeAuthService.AUTHENTICATE_ACCESS_TOKEN(this.box, rawToken);
    return $AuthContext.read(JSON_READER, rawOut);
  }

  async grantOauthAuthorization(acx: AuthContext, options: GrantOauthAuthorizationOptions): Promise<string> {
    const rawAcx: string = $AuthContext.write(JSON_WRITER, acx);
    const rawOptions: string = $GrantOauthAuthorizationOptions.write(JSON_WRITER, options);
    const rawOut = await NativeAuthService.GRANT_OAUTH_AUTHORIZATION(this.box, rawAcx, rawOptions);
    return JSON.parse(rawOut).redirect_uri;
  }

  async createAccessToken(acx: AuthContext, options: CreateAccessTokenOptions): Promise<OauthAccessToken> {
    const rawAcx: string = $AuthContext.write(JSON_WRITER, acx);
    const rawOptions: string = $CreateAccessTokenOptions.write(JSON_WRITER, options);
    const rawOut = await NativeAuthService.CREATE_ACCESS_TOKEN(this.box, rawAcx, rawOptions);
    return $OauthAccessToken.read(JSON_READER, rawOut);
  }

  async authenticateCredentials(credentials: Credentials): Promise<AuthContext> {
    const rawCredentials: string = $Credentials.write(JSON_WRITER, credentials);
    const rawOut = await NativeAuthService.RAW_AUTHENTICATE_CREDENTIALS(this.box, rawCredentials);
    return $AuthContext.read(JSON_READER, rawOut);
  }

  async authenticateSession(_acx: AuthContext, sessionId: SessionId): Promise<UserAndSession | null> {
    const rawSessionId: string = $SessionId.write(JSON_WRITER, sessionId);
    const rawOut = await NativeAuthService.AUTHENTICATE_SESSION(this.box, rawSessionId);
    return $NullableUserAndSession.read(JSON_READER, rawOut);
  }

  async loginWithCredentials(_acx: AuthContext, credentials: UserCredentials): Promise<UserAndSession> {
    const rawCredentials: string = $UserCredentials.write(JSON_WRITER, credentials);
    const rawOut = await NativeAuthService.RAW_LOGIN_WITH_CREDENTIALS(this.box, rawCredentials);
    return $UserAndSession.read(JSON_READER, rawOut);
  }

  async registerOrLoginWithDinoparc(_acx: AuthContext, credentials: DinoparcCredentials): Promise<UserAndSession> {
    const rawCredentials: string = $DinoparcCredentials.write(JSON_WRITER, credentials);
    const rawOut = await NativeAuthService.REGISTER_OR_LOGIN_WITH_DINOPARC(this.box, rawCredentials);
    return $UserAndSession.read(JSON_READER, rawOut);
  }

  async registerOrLoginWithEmail(_acx: AuthContext, options: RegisterOrLoginWithEmailOptions): Promise<void> {
    const rawOptions: string = $RegisterOrLoginWithEmailOptions.write(JSON_WRITER, options);
    await NativeAuthService.REGISTER_OR_LOGIN_WITH_EMAIL(this.box, rawOptions);
  }

  async registerOrLoginWithHammerfest(_acx: AuthContext, credentials: HammerfestCredentials): Promise<UserAndSession> {
    const rawCredentials: string = $HammerfestCredentials.write(JSON_WRITER, credentials);
    const rawOut = await NativeAuthService.REGISTER_OR_LOGIN_WITH_HAMMERFEST(this.box, rawCredentials);
    return $UserAndSession.read(JSON_READER, rawOut);
  }

  async registerOrLoginWithTwinoidOauth(_acx: AuthContext, accessToken: RfcOauthAccessTokenKey): Promise<UserAndSession> {
    const rawAccessToken: string = $RfcOauthAccessTokenKey.write(JSON_WRITER, accessToken);
    const rawOut = await NativeAuthService.REGISTER_OR_LOGIN_WITH_TWINOID_OAUTH(this.box, rawAccessToken);
    return $UserAndSession.read(JSON_READER, rawOut);
  }

  async registerWithUsername(_acx: AuthContext, options: RegisterWithUsernameOptions): Promise<UserAndSession> {
    const rawOptions: string = $RegisterWithUsernameOptions.write(JSON_WRITER, options);
    const rawOut = await NativeAuthService.REGISTER_WITH_USERNAME(this.box, rawOptions);
    return $UserAndSession.read(JSON_READER, rawOut);
  }

  async registerWithVerifiedEmail(_acx: AuthContext, options: RegisterWithVerifiedEmailOptions): Promise<UserAndSession> {
    const rawOptions: string = $RegisterWithVerifiedEmailOptions.write(JSON_WRITER, options);
    const rawOut = await NativeAuthService.REGISTER_WITH_VERIFIED_EMAIL(this.box, rawOptions);
    return $UserAndSession.read(JSON_READER, rawOut);
  }
}
