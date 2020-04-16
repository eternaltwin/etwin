import { $AuthContext, AuthContext } from "@eternal-twin/etwin-api-types/lib/auth/auth-context.js";
import { AuthScope } from "@eternal-twin/etwin-api-types/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/etwin-api-types/lib/auth/auth-type.js";
import { $Credentials, Credentials } from "@eternal-twin/etwin-api-types/lib/auth/credentials.js";
import { GuestAuthContext } from "@eternal-twin/etwin-api-types/lib/auth/guest-auth-context.js";
import { AuthService } from "@eternal-twin/etwin-api-types/lib/auth/service.js";
import { UserAndSession } from "@eternal-twin/etwin-api-types/lib/auth/user-and-session.js";
import { $UserRef } from "@eternal-twin/etwin-api-types/lib/user/user-ref.js";
import Koa from "koa";
import koaBodyParser from "koa-bodyparser";
import koaCompose from "koa-compose";
import koaRoute from "koa-route";
import { CaseStyle } from "kryo";
import { JsonValueReader } from "kryo-json/lib/json-value-reader.js";
import { JsonValueWriter } from "kryo-json/lib/json-value-writer.js";
import { QsValueReader } from "kryo-qs/lib/qs-value-reader.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TsEnumType } from "kryo/lib/ts-enum.js";

import { KoaAuth, SESSION_COOKIE } from "./helpers/koa-auth.js";

const JSON_VALUE_WRITER: JsonValueWriter = new JsonValueWriter();
const JSON_VALUE_READER: JsonValueReader = new JsonValueReader();
const QS_VALUE_READER: QsValueReader = new QsValueReader();

const GUEST_AUTH: GuestAuthContext = {type: AuthType.Guest, scope: AuthScope.Default};

export interface Api {
  auth: AuthService;
  koaAuth: KoaAuth;
}

enum AuthMethod {
  Credentials,
  HammerfestCredentials,
}

const $AuthMethod: TsEnumType<AuthMethod> = new TsEnumType<AuthMethod>({
  enum: AuthMethod,
});

export interface CreateSessionQuery {
  method: AuthMethod;
}

export const $CreateSessionQuery: RecordIoType<CreateSessionQuery> = new RecordType<CreateSessionQuery>({
  properties: {
    method: {type: $AuthMethod},
  },
  changeCase: CaseStyle.SnakeCase,
});


export function createAuthRouter(api: Api): Koa {
  const router: Koa = new Koa();

  router.use(koaRoute.get("/self", getSelf));

  async function getSelf(cx: Koa.Context): Promise<void> {
    const auth: AuthContext = await api.koaAuth.auth(cx);
    cx.response.body = $AuthContext.write(JSON_VALUE_WRITER, auth);
  }

  router.use(koaRoute.put("/self", koaCompose([koaBodyParser(), createSession])));

  async function createSession(cx: Koa.Context): Promise<void> {
    const query: CreateSessionQuery = $CreateSessionQuery.read(QS_VALUE_READER, cx.request.query);
    switch (query.method) {
      case AuthMethod.Credentials: {
        await createSessionWithCredentials(cx);
        break;
      }
      case AuthMethod.HammerfestCredentials: {
        await createSessionWithHammerfestCredentials(cx);
        break;
      }
      default: {
        cx.response.status = 422;
        cx.response.body = {error: "InvalidMethod"};
      }
    }
  }

  async function createSessionWithCredentials(cx: Koa.Context): Promise<void> {
    const credentials: Credentials = $Credentials.read(JSON_VALUE_READER, cx.request.body);
    const result: UserAndSession = await api.auth.loginWithCredentials(GUEST_AUTH, credentials);
    cx.cookies.set(SESSION_COOKIE, result.session.id);
    cx.response.body = $UserRef.write(JSON_VALUE_WRITER, result.user);
  }

  async function createSessionWithHammerfestCredentials(cx: Koa.Context): Promise<void> {
    cx.response.status = 500;
  }

  return router;
}
