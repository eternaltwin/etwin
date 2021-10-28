import { Api, testAnnouncementService } from "@eternal-twin/announcement-test";
import { ForumConfig } from "@eternal-twin/core/forum/forum-config";
import { InMemoryForumService } from "@eternal-twin/forum-in-memory";
import { getLocalConfig } from "@eternal-twin/local-config";
import { MemAuthStore } from "@eternal-twin/native/auth-store";
import { VirtualClock } from "@eternal-twin/native/clock";
import { MemDinoparcClient } from "@eternal-twin/native/dinoparc-client";
import { MemDinoparcStore } from "@eternal-twin/native/dinoparc-store";
import { JsonEmailFormatter } from "@eternal-twin/native/email-formatter";
import { MemHammerfestClient } from "@eternal-twin/native/hammerfest-client";
import { MemHammerfestStore } from "@eternal-twin/native/hammerfest-store";
import { MemLinkStore } from "@eternal-twin/native/link-store";
import { MemMailer } from "@eternal-twin/native/mailer";
import { MemOauthProviderStore } from "@eternal-twin/native/oauth-provider-store";
import { ScryptPasswordService } from "@eternal-twin/native/password";
import { NativeAuthService } from "@eternal-twin/native/services/auth";
import { HttpTwinoidClient } from "@eternal-twin/native/twinoid-client";
import { MemTwinoidStore } from "@eternal-twin/native/twinoid-store";
import { MemUserStore } from "@eternal-twin/native/user-store";
import { Uuid4Generator } from "@eternal-twin/native/uuid";
import { Buffer } from "buffer";

import { MemAnnouncementService } from "../lib/index.mjs";

async function withMemAnnouncementService<R>(fn: (api: Api) => Promise<R>): Promise<R> {
  const config = await getLocalConfig();

  const clock = new VirtualClock();
  const uuidGenerator = new Uuid4Generator();
  const secretKeyStr: string = config.etwin.secret;
  const secretKeyBytes: Uint8Array = Buffer.from(secretKeyStr);
  const mailer = await MemMailer.create();
  const emailFormatter = await JsonEmailFormatter.create();
  const passwordService = ScryptPasswordService.recommendedForTests();
  const dinoparcStore = new MemDinoparcStore({clock});
  const hammerfestStore = new MemHammerfestStore({clock});
  const twinoidStore = new MemTwinoidStore({clock});
  const dinoparcClient = new MemDinoparcClient({clock});
  const hammerfestClient = new MemHammerfestClient({clock});
  const twinoidClient = new HttpTwinoidClient({clock});
  const userStore = new MemUserStore({clock, uuidGenerator});
  const linkStore = new MemLinkStore({clock});
  const oauthProviderStore = await MemOauthProviderStore.create({clock, passwordService, uuidGenerator});
  const authStore = await MemAuthStore.create({clock, uuidGenerator});

  const auth = await NativeAuthService.create({authStore, clock, dinoparcClient, dinoparcStore, emailFormatter, hammerfestClient, hammerfestStore, linkStore, mailer, oauthProviderStore, passwordService, userStore, twinoidClient, twinoidStore, uuidGenerator, authSecret: secretKeyBytes});

  const forumConfig: ForumConfig = {postsPerPage: 10, threadsPerPage: 20};
  const forum = new InMemoryForumService(uuidGenerator, userStore, forumConfig);
  const announcement = new MemAnnouncementService({uuidGenerator, forum});

  return fn({auth, forum, announcement});
}

describe("MemAnnouncementService", function () {
  testAnnouncementService(withMemAnnouncementService);
});
