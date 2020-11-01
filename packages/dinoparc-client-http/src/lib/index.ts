import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { DinoparcClientService } from "@eternal-twin/core/lib/dinoparc/client.js";
import { DinoparcCredentials } from "@eternal-twin/core/lib/dinoparc/dinoparc-credentials.js";
import { DinoparcMachineId } from "@eternal-twin/core/lib/dinoparc/dinoparc-machine-id.js";
import { $DinoparcPassword } from "@eternal-twin/core/lib/dinoparc/dinoparc-password.js";
import { DinoparcServer } from "@eternal-twin/core/lib/dinoparc/dinoparc-server.js";
import { DinoparcSession } from "@eternal-twin/core/lib/dinoparc/dinoparc-session.js";
import { $DinoparcUsername, DinoparcUsername } from "@eternal-twin/core/lib/dinoparc/dinoparc-username.js";
import { DinoparcTimeoutError } from "@eternal-twin/core/lib/dinoparc/errors/dinoparc-timeout.js";
import { DinoparcUnknownError } from "@eternal-twin/core/lib/dinoparc/errors/dinoparc-unknown.js";
import { InvalidDinoparcCredentialsError } from "@eternal-twin/core/lib/dinoparc/errors/invalid-dinoparc-credentials.js";
import { Cookie, CookieAccessInfo } from "cookiejar";
import crypto from "crypto";
import iconv from "iconv-lite";
import { performance } from "perf_hooks";
import superagent from "superagent";

import { DinoparcSessionCookieNotFound } from "./errors/dinoparc-session-cookie-not-found.js";
import { ScrapeError } from "./errors/scrape-error.js";
import { UnexpectedStatusCode } from "./errors/unexpected-status-code.js";
import { DinoparcBankScraping, scrapeBank } from "./scraping/bank.js";
import { DinoparcUri } from "./uri.js";

const TIMEOUT: number = 5000;

async function callDinoparc<T>(server: DinoparcServer, timeout: number, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (
      (e instanceof DinoparcTimeoutError)
      || (e instanceof DinoparcUnknownError)
      || (e instanceof InvalidDinoparcCredentialsError)
    ) {
      throw e;
    } else {
      if (e.errno === "ETIME" || e.errno === "ETIMEDOUT") {
        throw new DinoparcTimeoutError({server, timeout});
      }
      throw new DinoparcUnknownError({server, cause: e});
    }
  }
}

function deriveMachineId(server: DinoparcServer, username: DinoparcUsername): DinoparcMachineId {
  const charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const hash = crypto.createHash("md5").update(JSON.stringify([server, username.toLowerCase()])).digest();
  let mid = "";
  for (let i = 0; i < 32; i++) {
    mid += charset[hash[i % hash.length] % charset.length];
  }
  return mid;
}

export class HttpDinoparcClientService implements DinoparcClientService {
  private readonly uri: DinoparcUri;

  constructor() {
    this.uri = new DinoparcUri();
  }

  public async createSession(credentials: DinoparcCredentials): Promise<DinoparcSession> {
    return callDinoparc(credentials.server, TIMEOUT, () => this.innerCreateSession(credentials, TIMEOUT));
  }

  private async innerCreateSession(credentials: DinoparcCredentials, timeout: number): Promise<DinoparcSession> {
    if (!$DinoparcUsername.test(credentials.username) || !$DinoparcPassword.test(credentials.password)) {
      throw new InvalidDinoparcCredentialsError({server: credentials.server, username: credentials.username});
    }

    const loginUri = this.uri.login(credentials.server);
    const ctime = new Date();
    const startTime: number = performance.now();
    const agent = superagent.agent();
    const loginRes = await agent.post(loginUri.toString())
      .type("application/x-www-form-urlencoded")
      .timeout(timeout)
      .redirects(0)
      .ok(() => true)
      .send({login: credentials.username, pass: credentials.password});

    switch (loginRes.status) {
      case 200: {
        const sessionCookie: Cookie | undefined = agent.jar.getCookie("sid", new CookieAccessInfo(loginUri.host));
        if (sessionCookie === undefined) {
          throw new DinoparcSessionCookieNotFound();
        }
        {
          const remainingTime: number = Math.max(1, timeout - (performance.now() - startTime));
          await this.touchAdTracking(agent, credentials.server, credentials.username, remainingTime);
        }
        {
          const remainingTime: number = Math.max(1, timeout - (performance.now() - startTime));
          await this.confirmLogin(agent, credentials.server, remainingTime);
        }
        const remainingTime: number = Math.max(1, timeout - (performance.now() - startTime));
        const bank = await this.innerGetBank(agent, credentials.server, remainingTime);

        if (bank.context.self === null) {
          throw new ScrapeError("MissingBankSelfContext");
        }

        const session: DinoparcSession = {
          ctime,
          atime: ctime,
          key: sessionCookie.value,
          user: {
            type: ObjectType.DinoparcUser,
            server: credentials.server,
            id: bank.userId,
            username: bank.context.self.username,
          }
        };

        return session;
      }
      default:
        throw new UnexpectedStatusCode(loginRes.status, new Set([200]), "POST", loginUri);
    }
  }

  private async innerGetBank(
    agent: superagent.SuperAgent<superagent.SuperAgentRequest>,
    server: DinoparcServer,
    timeout: number
  ): Promise<DinoparcBankScraping> {
    const bankUri = this.uri.bank(server);
    const bankRes = await agent.get(bankUri.toString())
      .buffer(true)
      .parse(superagent.parse["application/octet-stream"])
      .timeout(timeout);
    if (bankRes.status !== 200) {
      throw new UnexpectedStatusCode(bankRes.status, new Set([200]), "GET", bankUri);
    }
    const bankHtml: string = iconv.decode(bankRes.body, bankRes.charset);
    const scraped: DinoparcBankScraping = await scrapeBank(bankHtml);
    return scraped;
  }

  private async touchAdTracking(
    agent: superagent.SuperAgent<superagent.SuperAgentRequest>,
    server: DinoparcServer,
    username: DinoparcUsername,
    timeout: number,
  ): Promise<void> {
    const machineId = deriveMachineId(server, username);
    const uri = this.uri.adTracking(server, machineId);
    const res = await agent.get(uri.toString()).timeout(timeout);
    if (res.status !== 200 || res.text !== "OK") {
      throw new Error("TouchAdTrackingError");
    }
  }

  private async confirmLogin(
    agent: superagent.SuperAgent<superagent.SuperAgentRequest>,
    server: DinoparcServer,
    timeout: number,
  ): Promise<void> {
    const uri = this.uri.login(server);
    const res = await agent.get(uri.toString()).timeout(timeout);
    if (res.status !== 200) {
      throw new Error("ConfirmLoginError");
    }
  }
}
