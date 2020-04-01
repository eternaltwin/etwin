import { ngExpressEngine } from "@nguniversal/express-engine";
import { AppServerModule } from "../app/app.server.module";
import * as sysPath from "path";

export interface KoaEngineOptions {
  baseDir: string;
  bootstrap: any;
}

export class NgKoaEngine {
  private readonly ngEngine: any;
  private readonly baseDir: string;

  public constructor(options: KoaEngineOptions) {
    this.baseDir = options.baseDir;
    this.ngEngine = ngExpressEngine({
      bootstrap: AppServerModule,
    });
  }

  public async render(req: any, res: any): Promise<string> {
    return new Promise((resolve, reject) => {
      this.ngEngine(sysPath.join(this.baseDir, "index.html"), {req, res}, (err, doc) => {
        if (err !== null) {
          reject(err);
        } else {
          resolve(doc);
        }
      });
    });
  }
}
