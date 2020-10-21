import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { ForumConfig } from "@eternal-twin/core/lib/forum/forum-config.js";
import { ForumService } from "@eternal-twin/core/lib/forum/service.js";
import { SimpleUserService } from "@eternal-twin/core/lib/user/simple.js";
import { KoaAuth } from "@eternal-twin/rest-server/lib/helpers/koa-auth.js";
import url from "url";

interface Api {
  auth: AuthService;
  forum: ForumService;
  koaAuth: KoaAuth;
  simpleUser: SimpleUserService;
}

export interface ServerAppConfig {
  externalUri?: url.URL;
  isIndexNextToServerMain: boolean;
  isProduction: boolean;
  api: Api;
  forum: ForumConfig;
}
