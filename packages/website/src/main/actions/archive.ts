import { archiveDinoparc, archiveHammerfest } from "@eternal-twin/core/lib/auth/service";
import { DinoparcClient } from "@eternal-twin/core/lib/dinoparc/client";
import { $DinoparcPassword, DinoparcPassword } from "@eternal-twin/core/lib/dinoparc/dinoparc-password";
import { $DinoparcServer, DinoparcServer } from "@eternal-twin/core/lib/dinoparc/dinoparc-server";
import { $DinoparcUsername, DinoparcUsername } from "@eternal-twin/core/lib/dinoparc/dinoparc-username";
import { DinoparcStore } from "@eternal-twin/core/lib/dinoparc/store";
import { HammerfestClient } from "@eternal-twin/core/lib/hammerfest/client";
import { $HammerfestPassword, HammerfestPassword } from "@eternal-twin/core/lib/hammerfest/hammerfest-password";
import { $HammerfestServer, HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server";
import { $HammerfestUsername, HammerfestUsername } from "@eternal-twin/core/lib/hammerfest/hammerfest-username";
import { HammerfestStore } from "@eternal-twin/core/lib/hammerfest/store";
import Router from "@koa/router";
import { ParameterizedContext } from "koa";
import koaBodyParser from "koa-bodyparser";
import koaCompose from "koa-compose";
import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";
import { JSON_VALUE_READER } from "kryo-json/json-value-reader";

export interface Api {
  dinoparcClient: DinoparcClient;
  dinoparcStore: DinoparcStore;
  hammerfestClient: HammerfestClient;
  hammerfestStore: HammerfestStore;
}

export interface ArchiveDinoparc {
  /**
   * Dinoparc server.
   */
  dinoparcServer: DinoparcServer;

  /**
   * Username for the Dinoparc user.
   */
  dinoparcUsername: DinoparcUsername;

  /**
   * Password for the Dinoparc user.
   */
  dinoparcPassword: DinoparcPassword;
}

export const $ArchiveDinoparc: RecordIoType<ArchiveDinoparc> = new RecordType<ArchiveDinoparc>({
  properties: {
    dinoparcServer: {type: $DinoparcServer},
    dinoparcUsername: {type: $DinoparcUsername},
    dinoparcPassword: {type: $DinoparcPassword},
  },
  changeCase: CaseStyle.SnakeCase,
});


export interface ArchiveHammerfest {
  /**
   * Hammerfest server.
   */
  hammerfestServer: HammerfestServer;

  /**
   * Username for the Hammerfest user.
   */
  hammerfestUsername: HammerfestUsername;

  /**
   * Password for the Hammerfest user.
   */
  hammerfestPassword: HammerfestPassword;
}

export const $ArchiveHammerfest: RecordIoType<ArchiveHammerfest> = new RecordType<ArchiveHammerfest>({
  properties: {
    hammerfestServer: {type: $HammerfestServer},
    hammerfestUsername: {type: $HammerfestUsername},
    hammerfestPassword: {type: $HammerfestPassword},
  },
  changeCase: CaseStyle.SnakeCase,
});


export async function createArchiveRouter(api: Api): Promise<Router> {
  const router: Router = new Router();

  router.post("/dinoparc", koaCompose([koaBodyParser(), handleDinoparc]));

  async function handleDinoparc(cx: ParameterizedContext): Promise<void> {
    let options: ArchiveDinoparc;
    try {
      options = $ArchiveDinoparc.read(JSON_VALUE_READER, cx.request.body);
    } catch (err) {
      cx.response.status = 422;
      // cx.response.redirect("/settings");
      return;
    }

    try {
      await tryArchiveDinoparc(options);
    } catch (err) {
      console.log(err);
      cx.response.status = 400;
      return;
    }

    cx.response.redirect("/");
  }

  async function tryArchiveDinoparc(options: ArchiveDinoparc): Promise<void> {
    const dparcSession = await api.dinoparcClient.createSession({
      server: options.dinoparcServer,
      username: options.dinoparcUsername,
      password: options.dinoparcPassword,
    });
    await api.dinoparcStore.touchShortUser(dparcSession.user);
    archiveDinoparc(api.dinoparcClient, api.dinoparcStore, dparcSession);
    // await this.#token.touchDinoparc(dparcSession.user.server, dparcSession.key, dparcSession.user.id);
  }

  router.post("/hammerfest", koaCompose([koaBodyParser(), handleHammerfest]));

  async function handleHammerfest(cx: ParameterizedContext): Promise<void> {
    let options: ArchiveHammerfest;
    try {
      options = $ArchiveHammerfest.read(JSON_VALUE_READER, cx.request.body);
    } catch (err) {
      cx.response.status = 422;
      return;
    }

    try {
      await tryArchiveHammerfest(options);
    } catch (err) {
      console.log(err);
      cx.response.status = 400;
      return;
    }

    cx.response.redirect("/");
  }

  async function tryArchiveHammerfest(options: ArchiveHammerfest): Promise<void> {
    const hfSession = await api.hammerfestClient.createSession({
      server: options.hammerfestServer,
      username: options.hammerfestUsername,
      password: options.hammerfestPassword,
    });
    await api.hammerfestStore.touchShortUser(hfSession.user);
    archiveHammerfest(api.hammerfestClient, api.hammerfestStore, hfSession);
    // await this.#token.touchHammerfest(hfSession.user.server, hfSession.key, hfSession.user.id);
  }

  return router;
}
