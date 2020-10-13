import { HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server";
import url from "url";

export class HammerfestUri {
  private readonly servers: ReadonlyMap<HammerfestServer, string>;

  constructor() {
    this.servers = new Map([
      ["hammerfest.fr", "http://www.hammerfest.fr/"],
      ["hfest.net", "http://www.hfest.net/"],
      ["hammerfest.es", "http://www.hammerfest.es/"],
    ]);
  }

  login(server: HammerfestServer): url.URL {
    const uri: url.URL = new url.URL(this.getServer(server));
    uri.pathname = "/login.html";
    return uri;
  }

  play(server: HammerfestServer): url.URL {
    const uri: url.URL = new url.URL(this.getServer(server));
    uri.pathname = "/play.html";
    return uri;
  }

  private getServer(server: HammerfestServer): string {
    const uri: string | undefined = this.servers.get(server);
    if (uri === undefined) {
      throw new Error(`UnknownServer: ${server}`);
    }
    return uri;
  }
}
