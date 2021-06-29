import { AuthService } from "@eternal-twin/core/lib/auth/service";
import { Url } from "@eternal-twin/core/lib/core/url";
import { DinoparcService } from "@eternal-twin/core/lib/dinoparc/service";
import { ForumConfig } from "@eternal-twin/core/lib/forum/forum-config";
import { ForumService } from "@eternal-twin/core/lib/forum/service";
import { HammerfestService } from "@eternal-twin/core/lib/hammerfest/service";
import { TwinoidService } from "@eternal-twin/core/lib/twinoid/service";
import { UserService } from "@eternal-twin/core/lib/user/service";
import { KoaAuth } from "@eternal-twin/rest-server/lib/helpers/koa-auth";

interface Api {
  auth: AuthService;
  dinoparc: DinoparcService;
  forum: ForumService;
  hammerfest: HammerfestService;
  koaAuth: KoaAuth;
  twinoid: TwinoidService;
  user: UserService;
}

export interface ServerAppConfig {
  externalUri?: Url;
  isIndexNextToServerMain: boolean;
  isProduction: boolean;
  api: Api;
  marktwin: typeof import("@eternal-twin/marktwin");
  forum: ForumConfig;
}
