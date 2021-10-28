import { $Announcement, Announcement } from "@eternal-twin/core/announcement/announcement";
import { $AnnouncementListing, AnnouncementListing } from "@eternal-twin/core/announcement/announcement-listing";
import {
  $CreateAnnouncementOptions,
  CreateAnnouncementOptions
} from "@eternal-twin/core/announcement/create-announcement-options";
import { AnnouncementService } from "@eternal-twin/core/announcement/service";
import { AuthContext } from "@eternal-twin/core/auth/auth-context";
import { AuthService } from "@eternal-twin/core/auth/service";
import { $ListingQuery, ListingQuery } from "@eternal-twin/core/core/listing-query";
import Router  from "@koa/router";
import Koa, { ParameterizedContext } from "koa";
import { JSON_VALUE_READER } from "kryo-json/json-value-reader";
import { JSON_VALUE_WRITER } from "kryo-json/json-value-writer";
import { QS_VALUE_READER } from "kryo-qs/qs-value-reader";

import { KoaAuth } from "./helpers/koa-auth.mjs";
import { KoaState } from "./koa-state.mjs";

export interface Api {
  auth: AuthService;
  koaAuth: KoaAuth;
  announcement: AnnouncementService;
}

export function createAnnouncementsRouter(api: Api): Router {
  const router: Router = new Router();

  router.get("/", getAnnouncements);

  async function getAnnouncements(cx: ParameterizedContext<KoaState>): Promise<void> {
    let query: ListingQuery;
    try {
      query = $ListingQuery.read(QS_VALUE_READER, cx.request.query);
    } catch (_err) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidQueryParameters"};
      return;
    }
    const auth: AuthContext = await api.koaAuth.auth(cx as any as Koa.Context);
    let offset: number = 0;
    let limit: number = 20;
    if (query.offset !== undefined) {
      offset = query.offset;
    }
    if (query.limit !== undefined) {
      limit = query.limit;
    }
    const announcements: AnnouncementListing = await api.announcement.getAnnouncements(auth, {
      offset: offset,
      limit: limit
    });
    cx.response.body = $AnnouncementListing.write(JSON_VALUE_WRITER, announcements);
  }

  router.post("/", postAnnouncement);

  async function postAnnouncement(cx: ParameterizedContext<KoaState>): Promise<void> {
    const auth: AuthContext = await api.koaAuth.auth(cx as any as Koa.Context);
    let body: CreateAnnouncementOptions;
    try {
      body = $CreateAnnouncementOptions.read(JSON_VALUE_READER, cx.request.body);
    } catch (_err) {
      cx.response.status = 422;
      cx.response.body = {error: "InvalidRequestBody"};
      return;
    }
    const announcement: Announcement = await api.announcement.createAnnouncement(auth, body);
    cx.response.body = $Announcement.write(JSON_VALUE_WRITER, announcement);
  }

  router.get("/:id", getAnnouncement);

  async function getAnnouncement(cx: ParameterizedContext<KoaState>): Promise<void> {

    const auth: AuthContext = await api.koaAuth.auth(cx as any as Koa.Context);
    const announcement: Announcement | null = await api.announcement.getAnnouncementById(auth, cx.params["id"]);
    if (announcement === null) {
      cx.response.status = 404;
      cx.response.body = {error: "AnnouncementNotFound"};
      return;
    }
    cx.response.body = $Announcement.write(JSON_VALUE_WRITER, announcement);
  }

  return router;
}
