import { AuthContext } from "@eternal-twin/core/auth/auth-context";
import { AuthScope } from "@eternal-twin/core/auth/auth-scope";
import { AuthType } from "@eternal-twin/core/auth/auth-type";
import { GuestAuthContext } from "@eternal-twin/core/auth/guest-auth-context";
import { RegisterWithUsernameOptions } from "@eternal-twin/core/auth/register-with-username-options";
import { RegisterWithVerifiedEmailOptions } from "@eternal-twin/core/auth/register-with-verified-email-options";
import { AuthService } from "@eternal-twin/core/auth/service";
import { UserAndSession } from "@eternal-twin/core/auth/user-and-session";
import { $UserDisplayName, UserDisplayName } from "@eternal-twin/core/user/user-display-name";
import { $Username, Username } from "@eternal-twin/core/user/username";
import { KoaAuth, SESSION_COOKIE } from "@eternal-twin/rest-server/helpers/koa-auth";
import Router  from "@koa/router";
import Koa, { ParameterizedContext } from "koa";
import koaBodyParser from "koa-bodyparser";
import koaCompose from "koa-compose";
import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";
import { $Ucs2String } from "kryo/ucs2-string";
import { JsonValueReader } from "kryo-json/json-value-reader";

const JSON_VALUE_READER: JsonValueReader = new JsonValueReader();

const GUEST_AUTH: GuestAuthContext = {
  type: AuthType.Guest,
  scope: AuthScope.Default,
};

export interface RegisterWithVerifiedEmailBody {
  emailToken: string;
  displayName: UserDisplayName;
  password: string;
}

export const $RegisterWithVerifiedEmailBody: RecordIoType<RegisterWithVerifiedEmailBody> = new RecordType<RegisterWithVerifiedEmailBody>({
  properties: {
    emailToken: {type: $Ucs2String},
    displayName: {type: $UserDisplayName},
    password: {type: $Ucs2String},
  },
  changeCase: CaseStyle.SnakeCase,
});

export interface RegisterWithUsernameBody {
  username: Username;
  displayName: UserDisplayName;
  password: string;
}

export const $RegisterWithUsernameBody: RecordIoType<RegisterWithUsernameBody> = new RecordType<RegisterWithUsernameBody>({
  properties: {
    username: {type: $Username},
    displayName: {type: $UserDisplayName},
    password: {type: $Ucs2String},
  },
  changeCase: CaseStyle.SnakeCase,
});

type CreateUserBody = RegisterWithVerifiedEmailBody | RegisterWithUsernameBody;

const $CreateUserBody: TryUnionType<CreateUserBody> = new TryUnionType<CreateUserBody>({
  variants: [$RegisterWithVerifiedEmailBody, $RegisterWithUsernameBody],
});

export interface Api {
  auth: AuthService;
  koaAuth: KoaAuth;
}

export async function createRegisterRouter(api: Api): Promise<Router> {
  const router: Router = new Router();

  router.post("/", koaCompose([koaBodyParser(), registerUser]));

  async function registerUser(cx: ParameterizedContext): Promise<void> {
    let auth: AuthContext;
    try {
      auth = await api.koaAuth.auth(cx as any as Koa.Context);
    } catch (err) {
      console.error(err);
      auth = GUEST_AUTH;
    }

    const variantValue = $CreateUserBody.variantRead(JSON_VALUE_READER, cx.request.body);
    let userAndSession: UserAndSession;
    switch (variantValue.variant) {
      case $RegisterWithVerifiedEmailBody: {
        const body: RegisterWithVerifiedEmailBody = variantValue.value as RegisterWithVerifiedEmailBody;
        const options: RegisterWithVerifiedEmailOptions = {
          emailToken: body.emailToken,
          displayName: body.displayName,
          password: Buffer.from(body.password),
        };
        userAndSession = await api.auth.registerWithVerifiedEmail(auth, options);
        break;
      }
      case $RegisterWithUsernameBody: {
        const body: RegisterWithUsernameBody = variantValue.value as RegisterWithUsernameBody;
        const options: RegisterWithUsernameOptions = {
          username: body.username,
          displayName: body.displayName,
          password: Buffer.from(body.password),
        };
        userAndSession = await api.auth.registerWithUsername(auth, options);
        break;
      }
      default: {
        cx.response.status = 422;
        cx.response.body = {error: "InvalidBody"};
        return;
      }
    }
    cx.cookies.set(SESSION_COOKIE, userAndSession.session.id);
    cx.response.redirect("/");
  }

  return router;
}
