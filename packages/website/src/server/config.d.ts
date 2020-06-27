import { AuthService } from "@eternal-twin/core/lib/auth/service";
import { ForumService } from "@eternal-twin/core/lib/forum/service";
import { UserService } from "@eternal-twin/core/lib/user/service";
import { KoaAuth } from "@eternal-twin/rest-server/lib/helpers/koa-auth";
import url from "url";

interface Api {
  auth: AuthService;
  forum: ForumService;
  koaAuth: KoaAuth;
  user: UserService;
}

export interface ServerAppConfig {
  externalUri?: url.URL;
  isIndexNextToServerMain: boolean;
  isProduction: boolean;
  api: Api;
}
