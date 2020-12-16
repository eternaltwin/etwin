import { AuthService } from "@eternal-twin/core/lib/auth/service.js";
import { ForumConfig } from "@eternal-twin/core/lib/forum/forum-config.js";
import { ForumService } from "@eternal-twin/core/lib/forum/service.js";
import { HammerfestService } from "@eternal-twin/core/lib/hammerfest/service";
import { UserService } from "@eternal-twin/core/lib/user/service";
import { KoaAuth } from "@eternal-twin/rest-server/lib/helpers/koa-auth.js";
import url from "url";

interface Api {
  auth: AuthService;
  forum: ForumService;
  hammerfest: HammerfestService;
  koaAuth: KoaAuth;
  user: UserService;
}

export interface ServerAppConfig {
  externalUri?: url.URL;
  isIndexNextToServerMain: boolean;
  isProduction: boolean;
  api: Api;
  forum: ForumConfig;
}
