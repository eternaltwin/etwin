import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { $ForumThreadId, ForumThreadId } from "@eternal-twin/core/lib/forum/forum-thread-id.js";
import { $ForumThreadKey, ForumThreadKey } from "@eternal-twin/core/lib/forum/forum-thread-key.js";
import { $ForumThread, ForumThread } from "@eternal-twin/core/lib/forum/forum-thread.js";
import { ForumService } from "@eternal-twin/core/lib/forum/service.js";
import Koa from "koa";
import koaRoute from "koa-route";
import { JsonValueWriter } from "kryo-json/lib/json-value-writer.js";

import { KoaAuth } from "./helpers/koa-auth.js";

const JSON_VALUE_WRITER: JsonValueWriter = new JsonValueWriter();

// const JSON_VALUE_READER: JsonValueReader = new JsonValueReader();

export interface Api {
  auth: AuthService;
  koaAuth: KoaAuth;
  forum: ForumService;
}

export function createForumRouter(api: Api): Koa {
  const router: Koa = new Koa();

  router.use(koaRoute.get("/thread/:thread_id", getThreadByIdOrKey));

  async function getThreadByIdOrKey(cx: Koa.Context, rawThreadIdOrKey: string): Promise<void> {
    const auth: AuthContext = await api.koaAuth.auth(cx);
    if (!$ForumThreadId.test(rawThreadIdOrKey) && !$ForumThreadKey.test(rawThreadIdOrKey)) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidThreadIdOrKey"};
      return;
    }
    const threadIdOrKey: ForumThreadId | ForumThreadKey = rawThreadIdOrKey;
    const thread: ForumThread | null = await api.forum.getThreadById(auth, threadIdOrKey, {
      postOffset: 0,
      postLimit: 20,
    });
    if (thread === null) {
      cx.response.status = 404;
      cx.response.body = {error: "ThreadNotFound"};
      return;
    }
    cx.response.body = $ForumThread.write(JSON_VALUE_WRITER, thread);
  }

  return router;
}
