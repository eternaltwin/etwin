import { AuthService } from "@eternal-twin/core/auth/service";
import { Url } from "@eternal-twin/core/core/url";
import { DinoparcService } from "@eternal-twin/core/dinoparc/service";
import { ForumConfig } from "@eternal-twin/core/forum/forum-config";
import { ForumService } from "@eternal-twin/core/forum/service";
import { HammerfestService } from "@eternal-twin/core/hammerfest/service";
import { TwinoidService } from "@eternal-twin/core/twinoid/service";
import { UserService } from "@eternal-twin/core/user/service";
import { KoaAuth } from "@eternal-twin/rest-server/helpers/koa-auth";

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
