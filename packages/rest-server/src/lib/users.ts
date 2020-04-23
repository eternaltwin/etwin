import { AuthContext } from "@eternal-twin/etwin-api-types/lib/auth/auth-context.js";
import { AuthScope } from "@eternal-twin/etwin-api-types/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/etwin-api-types/lib/auth/auth-type.js";
import { GuestAuthContext } from "@eternal-twin/etwin-api-types/lib/auth/guest-auth-context.js";
import {
  $RegisterWithUsernameOptions,
  RegisterWithUsernameOptions,
} from "@eternal-twin/etwin-api-types/lib/auth/register-with-username-options.js";
import {
  $RegisterWithVerifiedEmailOptions,
  RegisterWithVerifiedEmailOptions,
} from "@eternal-twin/etwin-api-types/lib/auth/register-with-verified-email-options.js";
import { AuthService } from "@eternal-twin/etwin-api-types/lib/auth/service.js";
import { UserAndSession } from "@eternal-twin/etwin-api-types/lib/auth/user-and-session.js";
import { $CompleteUser, CompleteUser } from "@eternal-twin/etwin-api-types/lib/user/complete-user.js";
import { UserService } from "@eternal-twin/etwin-api-types/lib/user/service.js";
import { $UserId, UserId } from "@eternal-twin/etwin-api-types/lib/user/user-id.js";
import { $User, User } from "@eternal-twin/etwin-api-types/lib/user/user.js";
import Koa from "koa";
import koaBodyParser from "koa-bodyparser";
import koaCompose from "koa-compose";
import koaRoute from "koa-route";
import { JsonValueReader } from "kryo-json/lib/json-value-reader.js";
import { JsonValueWriter } from "kryo-json/lib/json-value-writer.js";
import { TryUnionType } from "kryo/lib/try-union.js";

import { KoaAuth, SESSION_COOKIE } from "./helpers/koa-auth.js";

const JSON_VALUE_WRITER: JsonValueWriter = new JsonValueWriter();
const JSON_VALUE_READER: JsonValueReader = new JsonValueReader();

const GUEST_AUTH: GuestAuthContext = {type: AuthType.Guest, scope: AuthScope.Default};

export interface Api {
  auth: AuthService;
  koaAuth: KoaAuth;
  user: UserService;
}

type CreateUserBody = RegisterWithVerifiedEmailOptions | RegisterWithUsernameOptions;

const $CreateUserBody: TryUnionType<CreateUserBody> = new TryUnionType<CreateUserBody>({
  variants: [$RegisterWithVerifiedEmailOptions, $RegisterWithUsernameOptions],
});

export function createUsersRouter(api: Api): Koa {
  const router: Koa = new Koa();

  router.use(koaRoute.post("/", koaCompose([koaBodyParser(), createUser])));

  async function createUser(cx: Koa.Context): Promise<void> {
    const variantValue = $CreateUserBody.variantRead(JSON_VALUE_READER, cx.request.body);
    let userAndSession: UserAndSession;
    switch (variantValue.variant) {
      case $RegisterWithVerifiedEmailOptions: {
        const body: RegisterWithVerifiedEmailOptions = variantValue.value as RegisterWithVerifiedEmailOptions;
        userAndSession = await api.auth.registerWithVerifiedEmail(GUEST_AUTH, body);
        break;
      }
      case $RegisterWithUsernameOptions: {
        const body: RegisterWithUsernameOptions = variantValue.value as RegisterWithUsernameOptions;
        userAndSession = await api.auth.registerWithUsername(GUEST_AUTH, body);
        break;
      }
      default: {
        cx.response.status = 422;
        cx.response.body = {error: "InvalidBody"};
        return;
      }
    }
    cx.cookies.set(SESSION_COOKIE, userAndSession.session.id);
    cx.response.body = $User.write(JSON_VALUE_WRITER, userAndSession.user);
  }

  router.use(koaRoute.get("/:user_id", getUserById));

  async function getUserById(cx: Koa.Context, rawUserId: string): Promise<void> {
    const auth: AuthContext = await api.koaAuth.auth(cx);
    if (!$UserId.test(rawUserId)) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidId"};
      return;
    }
    const userId: UserId = rawUserId;
    const user: User | CompleteUser | null = await api.user.getUserById(auth, userId);
    if (user === null) {
      cx.response.status = 404;
      cx.response.body = {error: "UserNotFound"};
      return;
    }
    if ($CompleteUser.test(user as any)) {
      cx.response.body = $CompleteUser.write(JSON_VALUE_WRITER, user as CompleteUser);
    } else {
      cx.response.body = $User.write(JSON_VALUE_WRITER, user);
    }
  }

  return router;
}
