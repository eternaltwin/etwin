import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { $ListingQuery, ListingQuery } from "@eternal-twin/core/lib/core/listing-query.js";
import { $CreatePostOptions, CreatePostOptions } from "@eternal-twin/core/lib/forum/create-post-options.js";
import { $CreateThreadOptions, CreateThreadOptions } from "@eternal-twin/core/lib/forum/create-thread-options.js";
import { $ForumPost, ForumPost } from "@eternal-twin/core/lib/forum/forum-post.js";
import { $ForumPostId, ForumPostId } from "@eternal-twin/core/lib/forum/forum-post-id.js";
import { $ForumSection, ForumSection } from "@eternal-twin/core/lib/forum/forum-section.js";
import { $ForumSectionId } from "@eternal-twin/core/lib/forum/forum-section-id.js";
import { $ForumSectionKey } from "@eternal-twin/core/lib/forum/forum-section-key.js";
import { $ForumSectionListing, ForumSectionListing } from "@eternal-twin/core/lib/forum/forum-section-listing.js";
import { $ForumThread, ForumThread } from "@eternal-twin/core/lib/forum/forum-thread.js";
import { $ForumThreadId, ForumThreadId } from "@eternal-twin/core/lib/forum/forum-thread-id.js";
import { $ForumThreadKey, ForumThreadKey } from "@eternal-twin/core/lib/forum/forum-thread-key.js";
import { ForumService } from "@eternal-twin/core/lib/forum/service.js";
import { $UpdatePostOptions, UpdatePostOptions } from "@eternal-twin/core/lib/forum/update-post-options.js";
import { $UserIdRef, UserIdRef } from "@eternal-twin/core/lib/user/user-id-ref.js";
import Router, { RouterContext } from "@koa/router";
import Koa from "koa";
import koaBodyParser from "koa-bodyparser";
import koaCompose from "koa-compose";
import { JSON_VALUE_READER } from "kryo-json/lib/json-value-reader.js";
import { JSON_VALUE_WRITER } from "kryo-json/lib/json-value-writer.js";
import { QS_VALUE_READER } from "kryo-qs/lib/qs-value-reader.js";

import { KoaAuth } from "./helpers/koa-auth.js";
import { KoaState } from "./koa-state";

export interface Api {
  auth: AuthService;
  koaAuth: KoaAuth;
  forum: ForumService;
}

export function createForumRouter(api: Api): Router {
  const router: Router = new Router();

  router.get("/sections", getSections);

  async function getSections(cx: RouterContext<KoaState>): Promise<void> {
    const auth: AuthContext = await api.koaAuth.auth(cx as any as Koa.Context);
    const sections: ForumSectionListing = await api.forum.getSections(auth);
    cx.response.body = $ForumSectionListing.write(JSON_VALUE_WRITER, sections);
  }

  router.get("/sections/:section_id", getSectionById);

  async function getSectionById(cx: RouterContext<KoaState>): Promise<void> {
    const rawSectionIdOrKey: string = cx.params["section_id"];
    const auth: AuthContext = await api.koaAuth.auth(cx as any as Koa.Context);
    if (!$ForumSectionId.test(rawSectionIdOrKey) && !$ForumSectionKey.test(rawSectionIdOrKey)) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidSectionIdOrKey"};
      return;
    }
    const sectionIdOrKey: ForumThreadId | ForumThreadKey = rawSectionIdOrKey;
    let query: ListingQuery;
    try {
      query = $ListingQuery.read(QS_VALUE_READER, cx.request.query);
    } catch (_err) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidQueryParameters"};
      return;
    }
    const section: ForumSection | null = await api.forum.getSectionById(auth, sectionIdOrKey, {
      threadOffset: query.offset ?? 0,
      threadLimit: query.limit ?? api.forum.config.threadsPerPage,
    });
    if (section === null) {
      cx.response.status = 404;
      cx.response.body = {error: "SectionNotFound"};
      return;
    }
    cx.response.body = $ForumSection.write(JSON_VALUE_WRITER, section);
  }

  router.post("/sections/:section_id", koaCompose([koaBodyParser(), createThread]));

  async function createThread(cx: RouterContext<KoaState>): Promise<void> {
    const rawSectionIdOrKey: string = cx.params["section_id"];
    const auth: AuthContext = await api.koaAuth.auth(cx as any as Koa.Context);
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

  router.post("/sections/:section_id/role_grants", koaCompose([koaBodyParser(), addModerator]));

  async function addModerator(cx: RouterContext<KoaState>): Promise<void> {
    const rawSectionIdOrKey: string = cx.params["section_id"];
    const auth: AuthContext = await api.koaAuth.auth(cx as any as Koa.Context);
    if (!$ForumSectionId.test(rawSectionIdOrKey) && !$ForumSectionKey.test(rawSectionIdOrKey)) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidSectionIdOrKey"};
      return;
    }
    const sectionIdOrKey: ForumThreadId | ForumThreadKey = rawSectionIdOrKey;
    let body: UserIdRef;
    try {
      body = $UserIdRef.read(JSON_VALUE_READER, cx.request.body);
    } catch (_err) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidRequestBody"};
      return;
    }
    const section: ForumSection = await api.forum.addModerator(auth, sectionIdOrKey, body.id);
    cx.response.body = $ForumSection.write(JSON_VALUE_WRITER, section);
  }

  router.delete("/sections/:section_id/role_grants", koaCompose([koaBodyParser(), deleteModerator]));

  async function deleteModerator(cx: RouterContext<KoaState>): Promise<void> {
    const rawSectionIdOrKey: string = cx.params["section_id"];
    const auth: AuthContext = await api.koaAuth.auth(cx as any as Koa.Context);
    if (!$ForumSectionId.test(rawSectionIdOrKey) && !$ForumSectionKey.test(rawSectionIdOrKey)) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidSectionIdOrKey"};
      return;
    }
    const sectionIdOrKey: ForumThreadId | ForumThreadKey = rawSectionIdOrKey;
    let body: UserIdRef;
    try {
      body = $UserIdRef.read(JSON_VALUE_READER, cx.request.body);
    } catch (_err) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidRequestBody"};
      return;
    }
    const section: ForumSection = await api.forum.deleteModerator(auth, sectionIdOrKey, body.id);
    cx.response.body = $ForumSection.write(JSON_VALUE_WRITER, section);
  }

  router.get("/threads/:thread_id", getThreadByIdOrKey);

  async function getThreadByIdOrKey(cx: RouterContext<KoaState>): Promise<void> {
    const rawThreadIdOrKey: string = cx.params["thread_id"];
    const auth: AuthContext = await api.koaAuth.auth(cx as any as Koa.Context);
    if (!$ForumThreadId.test(rawThreadIdOrKey) && !$ForumThreadKey.test(rawThreadIdOrKey)) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidThreadIdOrKey"};
      return;
    }
    const threadIdOrKey: ForumThreadId | ForumThreadKey = rawThreadIdOrKey;
    let query: ListingQuery;
    try {
      query = $ListingQuery.read(QS_VALUE_READER, cx.request.query);
    } catch (_err) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidQueryParameters"};
      return;
    }
    const thread: ForumThread | null = await api.forum.getThreadById(auth, threadIdOrKey, {
      postOffset: query.offset ?? 0,
      postLimit: query.limit ?? api.forum.config.postsPerPage,
    });
    if (thread === null) {
      cx.response.status = 404;
      cx.response.body = {error: "ThreadNotFound"};
      return;
    }
    cx.response.body = $ForumThread.write(JSON_VALUE_WRITER, thread);
  }

  router.post("/threads/:thread_id", koaCompose([koaBodyParser(), createPost]));

  async function createPost(cx: RouterContext<KoaState>): Promise<void> {
    const rawThreadIdOrKey: string = cx.params["thread_id"];
    const auth: AuthContext = await api.koaAuth.auth(cx as any as Koa.Context);
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

  router.get("/posts/:post_id", getPost);

  async function getPost(cx: RouterContext<KoaState>): Promise<void> {
    const rawPostId: string = cx.params["post_id"];
    const auth: AuthContext = await api.koaAuth.auth(cx as any as Koa.Context);
    if (!$ForumPostId.test(rawPostId)) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidPostId"};
      return;
    }
    const postId: ForumPostId = rawPostId;
    // let query: ListingQuery;
    // try {
    //   query = $ListingQuery.read(QS_VALUE_READER, cx.request.query);
    // } catch (_err) {
    //   cx.response.status = 422;
    //   cx.response.body = {error: "InvalidQueryParameters"};
    //   return;
    // }
    const post: ForumPost | null = await api.forum.getPost(auth, postId, /* {
      postOffset: query.offset ?? 0,
      postLimit: query.limit ?? api.forum.defaultPostsPerPage,
    }*/);
    if (post === null) {
      cx.response.status = 404;
      cx.response.body = {error: "PostNotFound"};
      return;
    }
    cx.response.body = $ForumPost.write(JSON_VALUE_WRITER, post);
  }

  router.patch("/posts/:post_id", koaCompose([koaBodyParser(), updatePost]));

  async function updatePost(cx: RouterContext<KoaState>): Promise<void> {
    const rawPostId: string = cx.params["post_id"];
    const auth: AuthContext = await api.koaAuth.auth(cx as any as Koa.Context);
    if (!$ForumPostId.test(rawPostId)) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidThreadIdOrKey"};
      return;
    }
    const postId: ForumPostId = rawPostId;
    let body: UpdatePostOptions;
    try {
      body = $UpdatePostOptions.read(JSON_VALUE_READER, cx.request.body);
    } catch (_err) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidRequestBody"};
      return;
    }
    const post: ForumPost = await api.forum.updatePost(auth, postId, body);
    cx.response.body = $ForumPost.write(JSON_VALUE_WRITER, post);
  }

  return router;
}
