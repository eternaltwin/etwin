import { DinoparcMachineId } from "@eternal-twin/core/lib/dinoparc/dinoparc-machine-id";
import { DinoparcServer } from "@eternal-twin/core/lib/dinoparc/dinoparc-server.js";
import url from "url";

export class DinoparcUri {
  private readonly servers: ReadonlyMap<DinoparcServer, string>;

  constructor() {
    this.servers = new Map([
      ["dinoparc.com", "http://www.dinoparc.com/"],
      ["en.dinoparc.com", "http://en.dinoparc.com/"],
      ["sp.dinoparc.com", "http://sp.dinoparc.com/"],
    ]);
  }

  index(server: DinoparcServer): url.URL {
    return new url.URL(this.getServer(server));
  }

  bank(server: DinoparcServer): url.URL {
    const uri: url.URL = new url.URL(this.getServer(server));
    uri.search = "a=bank";
    return uri;
  }

  login(server: DinoparcServer): url.URL {
    const uri: url.URL = new url.URL(this.getServer(server));
    uri.search = "a=login";
    return uri;
  }

  adTracking(server: DinoparcServer, machineId: DinoparcMachineId): url.URL {
    const uri: url.URL = new url.URL(this.getServer(server));
    uri.search = `a=adtk;m=${machineId}`;
    return uri;
  }

  private getServer(server: DinoparcServer): string {
    const uri: string | undefined = this.servers.get(server);
    if (uri === undefined) {
      throw new Error(`UnknownServer: ${server}`);
    }
    return uri;
  }
}
