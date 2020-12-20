import { $AuthContext, AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { AuthMethod } from "@eternal-twin/core/lib/auth/auth-method.js";
import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { $CreateSessionQuery, CreateSessionQuery } from "@eternal-twin/core/lib/auth/create-session-query.js";
import { GuestAuthContext } from "@eternal-twin/core/lib/auth/guest-auth-context.js";
import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { UserAndSession } from "@eternal-twin/core/lib/auth/user-and-session.js";
import { $UserCredentials, UserCredentials } from "@eternal-twin/core/lib/auth/user-credentials.js";
import { $DinoparcCredentials, DinoparcCredentials } from "@eternal-twin/core/lib/dinoparc/dinoparc-credentials.js";
import {
  $HammerfestCredentials,
  HammerfestCredentials,
} from "@eternal-twin/core/lib/hammerfest/hammerfest-credentials.js";
import { $MaybeCompleteUser } from "@eternal-twin/core/lib/user/maybe-complete-user.js";
import { UserService } from "@eternal-twin/core/lib/user/service.js";
import Router, { RouterContext } from "@koa/router";
import Koa from "koa";
import koaBodyParser from "koa-bodyparser";
import koaCompose from "koa-compose";
import { JSON_VALUE_READER } from "kryo-json/lib/json-value-reader.js";
import { JSON_VALUE_WRITER } from "kryo-json/lib/json-value-writer.js";
import { QsValueReader } from "kryo-qs/lib/qs-value-reader.js";

import { KoaAuth, SESSION_COOKIE } from "./helpers/koa-auth.js";
import { KoaState } from "./koa-state";

const QS_VALUE_READER: QsValueReader = new QsValueReader();

const GUEST_AUTH: GuestAuthContext = {type: AuthType.Guest, scope: AuthScope.Default};

export interface Api {
  auth: AuthService;
  koaAuth: KoaAuth;
  user: UserService;
}

export function createAuthRouter(api: Api): Router {
  const router: Router = new Router();

  router.get("/self", getSelf);

  async function getSelf(cx: RouterContext<KoaState>): Promise<void> {
    const auth: AuthContext = await api.koaAuth.auth(cx as any as Koa.Context);
    cx.response.body = $AuthContext.write(JSON_VALUE_WRITER, auth);
  }

  router.put("/self", koaCompose([koaBodyParser(), createSession]));

  async function createSession(cx:  RouterContext<KoaState>): Promise<void> {
    let query: CreateSessionQuery;
    try {
      query = $CreateSessionQuery.read(QS_VALUE_READER, cx.request.query);
    } catch (_err) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidMethod"};
      return;
    }
    switch (query.method) {
      case AuthMethod.Dinoparc: {
        await createSessionWithDinoparcCredentials(cx);
        break;
      }
      case AuthMethod.Etwin: {
        await createSessionWithCredentials(cx);
        break;
      }
      case AuthMethod.Hammerfest: {
        await createSessionWithHammerfestCredentials(cx);
        break;
      }
      case AuthMethod.Twinoid: {
        await createSessionWithTwinoidCredentials(cx as any as Koa.Context);
        break;
      }
      default: {
        cx.response.status = 422;
        cx.response.body = {error: "InvalidMethod"};
      }
    }
  }

  async function createSessionWithCredentials(cx: RouterContext<KoaState>): Promise<void> {
    const credentials: UserCredentials = $UserCredentials.read(JSON_VALUE_READER, cx.request.body);
    const result: UserAndSession = await api.auth.loginWithCredentials(GUEST_AUTH, credentials);
    cx.cookies.set(SESSION_COOKIE, result.session.id);
    const user = await api.user.getUserById(
      {type: AuthType.User, user: result.user, isAdministrator: result.user.isAdministrator, scope: AuthScope.Default},
      {id: result.user.id},
    );
    cx.response.body = $MaybeCompleteUser.write(JSON_VALUE_WRITER, user!);
  }

  async function createSessionWithDinoparcCredentials(cx: RouterContext<KoaState>): Promise<void> {
    const credentials: DinoparcCredentials = $DinoparcCredentials.read(JSON_VALUE_READER, cx.request.body);
    const result: UserAndSession = await api.auth.registerOrLoginWithDinoparc(GUEST_AUTH, credentials);
    cx.cookies.set(SESSION_COOKIE, result.session.id);
    const user = await api.user.getUserById(
      {type: AuthType.User, user: result.user, isAdministrator: result.user.isAdministrator, scope: AuthScope.Default},
      {id: result.user.id},
    );
    cx.response.body = $MaybeCompleteUser.write(JSON_VALUE_WRITER, user!);
  }

  async function createSessionWithHammerfestCredentials(cx: RouterContext<KoaState>): Promise<void> {
    const credentials: HammerfestCredentials = $HammerfestCredentials.read(JSON_VALUE_READER, cx.request.body);
    const result: UserAndSession = await api.auth.registerOrLoginWithHammerfest(GUEST_AUTH, credentials);
    cx.cookies.set(SESSION_COOKIE, result.session.id);
    const user = await api.user.getUserById(
      {type: AuthType.User, user: result.user, isAdministrator: result.user.isAdministrator, scope: AuthScope.Default},
      {id: result.user.id},
    );
    cx.response.body = $MaybeCompleteUser.write(JSON_VALUE_WRITER, user!);
  }

  async function createSessionWithTwinoidCredentials(cx: Koa.Context): Promise<void> {
    cx.response.status = 500;
  }

  router.delete("/self", deleteSession);

  async function deleteSession(cx: RouterContext<KoaState>): Promise<void> {
    cx.cookies.set(SESSION_COOKIE, "");
    cx.response.body = $AuthContext.write(JSON_VALUE_WRITER, GUEST_AUTH);
  }

  return router;
}
