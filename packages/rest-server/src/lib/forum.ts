import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { $CreatePostOptions, CreatePostOptions } from "@eternal-twin/core/lib/forum/create-post-options.js";
import { $CreateThreadOptions, CreateThreadOptions } from "@eternal-twin/core/lib/forum/create-thread-options.js";
import { $ForumPost, ForumPost } from "@eternal-twin/core/lib/forum/forum-post.js";
import { $ForumSectionId } from "@eternal-twin/core/lib/forum/forum-section-id.js";
import { $ForumSectionKey } from "@eternal-twin/core/lib/forum/forum-section-key.js";
import { $ForumSectionListing, ForumSectionListing } from "@eternal-twin/core/lib/forum/forum-section-listing.js";
import { $ForumSection, ForumSection } from "@eternal-twin/core/lib/forum/forum-section.js";
import { $ForumThreadId, ForumThreadId } from "@eternal-twin/core/lib/forum/forum-thread-id.js";
import { $ForumThreadKey, ForumThreadKey } from "@eternal-twin/core/lib/forum/forum-thread-key.js";
import { $ForumThread, ForumThread } from "@eternal-twin/core/lib/forum/forum-thread.js";
import { ForumService } from "@eternal-twin/core/lib/forum/service.js";
import Koa from "koa";
import koaBodyParser from "koa-bodyparser";
import koaCompose from "koa-compose";
import Router from "koa-router";
import { JSON_VALUE_READER } from "kryo-json/lib/json-value-reader.js";
import { JSON_VALUE_WRITER } from "kryo-json/lib/json-value-writer.js";

import { KoaAuth } from "./helpers/koa-auth.js";

export interface Api {
  auth: AuthService;
  koaAuth: KoaAuth;
  forum: ForumService;
}

export function createForumRouter(api: Api): Router {
  const router: Router = new Router();

  router.get("/sections", getSections);

  async function getSections(cx: Koa.Context): Promise<void> {
    const auth: AuthContext = await api.koaAuth.auth(cx);
    const sections: ForumSectionListing = await api.forum.getSections(auth);
    cx.response.body = $ForumSectionListing.write(JSON_VALUE_WRITER, sections);
  }

  router.get("/sections/:section_id", getSectionById);

  async function getSectionById(cx: Koa.Context): Promise<void> {
    const rawSectionIdOrKey: string = cx.params["section_id"];
    const auth: AuthContext = await api.koaAuth.auth(cx);
    if (!$ForumSectionId.test(rawSectionIdOrKey) && !$ForumSectionKey.test(rawSectionIdOrKey)) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidSectionIdOrKey"};
      return;
    }
    const sectionIdOrKey: ForumThreadId | ForumThreadKey = rawSectionIdOrKey;
    const section: ForumSection | null = await api.forum.getSectionById(auth, sectionIdOrKey, {
      threadOffset: 0,
      threadLimit: 20,
    });
    if (section === null) {
      cx.response.status = 404;
      cx.response.body = {error: "SectionNotFound"};
      return;
    }
    cx.response.body = $ForumSection.write(JSON_VALUE_WRITER, section);
  }

  router.post("/sections/:section_id", koaCompose([koaBodyParser(), createThread]));

  async function createThread(cx: Koa.Context): Promise<void> {
    const rawSectionIdOrKey: string = cx.params["section_id"];
    const auth: AuthContext = await api.koaAuth.auth(cx);
    if (!$ForumSectionId.test(rawSectionIdOrKey) && !$ForumSectionKey.test(rawSectionIdOrKey)) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidSectionIdOrKey"};
      return;
    }
    const sectionIdOrKey: ForumThreadId | ForumThreadKey = rawSectionIdOrKey;
    let body: CreateThreadOptions;
    try {
      body = $CreateThreadOptions.read(JSON_VALUE_READER, cx.request.body);
    } catch (_err) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidRequestBody"};
      return;
    }
    const thread: ForumThread = await api.forum.createThread(auth, sectionIdOrKey, body);
    cx.response.body = $ForumThread.write(JSON_VALUE_WRITER, thread);
  }

  router.get("/threads/:thread_id", getThreadByIdOrKey);

  async function getThreadByIdOrKey(cx: Koa.Context): Promise<void> {
    const rawThreadIdOrKey: string = cx.params["thread_id"];
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

  router.post("/threads/:thread_id", koaCompose([koaBodyParser(), createPost]));

  async function createPost(cx: Koa.Context): Promise<void> {
    const rawThreadIdOrKey: string = cx.params["thread_id"];
    const auth: AuthContext = await api.koaAuth.auth(cx);
    if (!$ForumThreadId.test(rawThreadIdOrKey) && !$ForumThreadKey.test(rawThreadIdOrKey)) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidThreadIdOrKey"};
      return;
    }
    const threadIdOrKey: ForumThreadId | ForumThreadKey = rawThreadIdOrKey;
    let body: CreatePostOptions;
    try {
      body = $CreatePostOptions.read(JSON_VALUE_READER, cx.request.body);
    } catch (_err) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidRequestBody"};
      return;
    }
    const post: ForumPost = await api.forum.createPost(auth, threadIdOrKey, body);
    cx.response.body = $ForumPost.write(JSON_VALUE_WRITER, post);
  }

  return router;
}
