import { $Announcement, Announcement } from "@eternal-twin/core/lib/announcement/announcement.js";
import { $AnnouncementListing, AnnouncementListing } from "@eternal-twin/core/lib/announcement/announcement-listing.js";
import {
  $CreateAnnouncementOptions,
  CreateAnnouncementOptions
} from "@eternal-twin/core/lib/announcement/create-announcement-options.js";
import { AnnouncementService } from "@eternal-twin/core/lib/announcement/service.js";
import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { $ListingQuery, ListingQuery } from "@eternal-twin/core/lib/core/listing-query.js";
import Router, { RouterContext } from "@koa/router";
import Koa from "koa";
import { JSON_VALUE_READER } from "kryo-json/lib/json-value-reader.js";
import { JSON_VALUE_WRITER } from "kryo-json/lib/json-value-writer.js";
import { QS_VALUE_READER } from "kryo-qs/lib/qs-value-reader.js";

import { KoaAuth } from "./helpers/koa-auth.js";
import { KoaState } from "./koa-state.js";

export interface Api {
  auth: AuthService;
  koaAuth: KoaAuth;
  announcement: AnnouncementService;
}

export function createAnnouncementsRouter(api: Api): Router {
  const router: Router = new Router();

  router.get("/", getAnnouncements);

  async function getAnnouncements(cx: RouterContext<KoaState>): Promise<void> {
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

  async function postAnnouncement(cx: RouterContext<KoaState>): Promise<void> {
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

  async function getAnnouncement(cx: RouterContext<KoaState>): Promise<void> {

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
