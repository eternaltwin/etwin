import { $AuthContext, AuthContext } from "@eternal-twin/core/lib/auth/auth-context";
import { AuthMethod } from "@eternal-twin/core/lib/auth/auth-method";
import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type";
import { $CreateSessionQuery, CreateSessionQuery } from "@eternal-twin/core/lib/auth/create-session-query";
import { GuestAuthContext } from "@eternal-twin/core/lib/auth/guest-auth-context";
import { AuthService } from "@eternal-twin/core/lib/auth/service";
import { UserAndSession } from "@eternal-twin/core/lib/auth/user-and-session";
import { $UserCredentials, UserCredentials } from "@eternal-twin/core/lib/auth/user-credentials";
import { $DinoparcCredentials, DinoparcCredentials } from "@eternal-twin/core/lib/dinoparc/dinoparc-credentials";
import {
  $HammerfestCredentials,
  HammerfestCredentials,
} from "@eternal-twin/core/lib/hammerfest/hammerfest-credentials";
import { $MaybeCompleteUser } from "@eternal-twin/core/lib/user/maybe-complete-user";
import { UserService } from "@eternal-twin/core/lib/user/service";
import Router  from "@koa/router";
import Koa, { ParameterizedContext } from "koa";
import koaBodyParser from "koa-bodyparser";
import koaCompose from "koa-compose";
import { JSON_VALUE_READER } from "kryo-json/json-value-reader";
import { JSON_VALUE_WRITER } from "kryo-json/json-value-writer";
import { QsValueReader } from "kryo-qs/qs-value-reader";

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

  async function getSelf(cx: ParameterizedContext<KoaState>): Promise<void> {
    const auth: AuthContext = await api.koaAuth.auth(cx as any as Koa.Context);
    cx.response.body = $AuthContext.write(JSON_VALUE_WRITER, auth);
  }

  router.put("/self", koaCompose([koaBodyParser(), createSession]));

  async function createSession(cx:  ParameterizedContext<KoaState>): Promise<void> {
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

  async function createSessionWithCredentials(cx: ParameterizedContext<KoaState>): Promise<void> {
    const credentials: UserCredentials = $UserCredentials.read(JSON_VALUE_READER, cx.request.body);
    const result: UserAndSession = await api.auth.loginWithCredentials(GUEST_AUTH, credentials);
    cx.cookies.set(SESSION_COOKIE, result.session.id);
    const user = await api.user.getUserById(
      {type: AuthType.User, user: result.user, isAdministrator: result.isAdministrator, scope: AuthScope.Default},
      {id: result.user.id},
    );
    cx.response.body = $MaybeCompleteUser.write(JSON_VALUE_WRITER, user!);
  }

  async function createSessionWithDinoparcCredentials(cx: ParameterizedContext<KoaState>): Promise<void> {
    const credentials: DinoparcCredentials = $DinoparcCredentials.read(JSON_VALUE_READER, cx.request.body);
    const result: UserAndSession = await api.auth.registerOrLoginWithDinoparc(GUEST_AUTH, credentials);
    cx.cookies.set(SESSION_COOKIE, result.session.id);
    const user = await api.user.getUserById(
      {type: AuthType.User, user: result.user, isAdministrator: result.isAdministrator, scope: AuthScope.Default},
      {id: result.user.id},
    );
    cx.response.body = $MaybeCompleteUser.write(JSON_VALUE_WRITER, user!);
  }

  async function createSessionWithHammerfestCredentials(cx: ParameterizedContext<KoaState>): Promise<void> {
    const credentials: HammerfestCredentials = $HammerfestCredentials.read(JSON_VALUE_READER, cx.request.body);
    const result: UserAndSession = await api.auth.registerOrLoginWithHammerfest(GUEST_AUTH, credentials);
    cx.cookies.set(SESSION_COOKIE, result.session.id);
    const user = await api.user.getUserById(
      {type: AuthType.User, user: result.user, isAdministrator: result.isAdministrator, scope: AuthScope.Default},
      {id: result.user.id},
    );
    cx.response.body = $MaybeCompleteUser.write(JSON_VALUE_WRITER, user!);
  }

  async function createSessionWithTwinoidCredentials(cx: Koa.Context): Promise<void> {
    cx.response.status = 500;
  }

  router.delete("/self", deleteSession);

  async function deleteSession(cx: ParameterizedContext<KoaState>): Promise<void> {
    cx.cookies.set(SESSION_COOKIE, "");
    cx.response.body = $AuthContext.write(JSON_VALUE_WRITER, GUEST_AUTH);
  }

  return router;
}
