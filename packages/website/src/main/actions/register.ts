import { AuthContext } from "@eternal-twin/etwin-api-types/lib/auth/auth-context.js";
import { AuthScope } from "@eternal-twin/etwin-api-types/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/etwin-api-types/lib/auth/auth-type.js";
import { GuestAuthContext } from "@eternal-twin/etwin-api-types/lib/auth/guest-auth-context.js";
import { RegisterWithUsernameOptions } from "@eternal-twin/etwin-api-types/lib/auth/register-with-username-options.js";
import { RegisterWithVerifiedEmailOptions } from "@eternal-twin/etwin-api-types/lib/auth/register-with-verified-email-options.js";
import { AuthService } from "@eternal-twin/etwin-api-types/lib/auth/service.js";
import { UserAndSession } from "@eternal-twin/etwin-api-types/lib/auth/user-and-session.js";
import { $UserDisplayName, UserDisplayName } from "@eternal-twin/etwin-api-types/lib/user/user-display-name.js";
import { $Username, Username } from "@eternal-twin/etwin-api-types/lib/user/username.js";
import { KoaAuth, SESSION_COOKIE } from "@eternal-twin/rest-server/lib/helpers/koa-auth.js";
import Koa from "koa";
import koaBodyParser from "koa-bodyparser";
import koaCompose from "koa-compose";
import koaRoute from "koa-route";
import { CaseStyle } from "kryo";
import { JsonValueReader } from "kryo-json/lib/json-value-reader.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TryUnionType } from "kryo/lib/try-union.js";
import { $Ucs2String } from "kryo/lib/ucs2-string.js";

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

export async function createRegisterRouter(api: Api): Promise<Koa> {
  const router: Koa = new Koa();

  router.use(koaRoute.post("/", koaCompose([koaBodyParser(), registerUser])));

  async function registerUser(cx: Koa.Context): Promise<void> {
    let auth: AuthContext;
    try {
      auth = await api.koaAuth.auth(cx);
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
