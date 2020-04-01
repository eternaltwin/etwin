import { ngExpressEngine } from "@nguniversal/express-engine";
import { ɵCommonEngine as CommonEngine } from "@nguniversal/common/engine";
import * as sysPath from "path";
import * as fs from "fs";
import { NgModuleFactory, Type } from "@angular/core";

export interface EngineOptions {
  baseDir: string;
  bootstrap: Type<{}> | NgModuleFactory<{}>;
}

export class NgKoaEngine {
  private readonly ngEngine: any;
  private readonly baseDir: string;
  private readonly document: string;
  private readonly commonEngine: CommonEngine;
  private readonly bootstrap: Type<{}> | NgModuleFactory<{}>;

  public static async create(options: EngineOptions): Promise<NgKoaEngine> {
    const indexPath = sysPath.join(options.baseDir, "index.html");
    const indexHtml = await readTextAsync(indexPath);
    return new NgKoaEngine(options, indexHtml);
  }

  private constructor(options: EngineOptions, document: string) {
    this.baseDir = options.baseDir;
    this.ngEngine = ngExpressEngine({
      bootstrap: options.bootstrap,
    });
    this.commonEngine = new CommonEngine(options.bootstrap, []);
    this.document = document;
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

  public async renderSimple(): Promise<string> {
    return this.commonEngine.render({
      bootstrap: this.bootstrap,
      document: this.document,
      url: "http://localhost:4200/",
      providers: [],
    });
  }
}

// import * as ngUniversalCommonEngine from "./common-engine.js";
// import angularCore from "@angular/core";
//
// /**
//  * These are the allowed options for the engine
//  */
// export interface EngineOptions {
//   bootstrap: angularCore.Type<{}> | angularCore.NgModuleFactory<{}>;
//   providers?: angularCore.StaticProvider[];
//   /**
//    * `index.html` source text.
//    */
//   document: string;
// }
//
// /**
//  * These are the allowed options for the render
//  */
// export interface RenderOptions {
//   url: string;
//   providers: angularCore.StaticProvider[];
// }
//
// /**
//  * Create a koa engine for handling Angular Applications
//  */
// export class NgKoaEngine {
//   private readonly bootstrap: angularCore.Type<{}> | angularCore.NgModuleFactory<{}>;
//   private readonly engine: CommonEngine;
//   private readonly document: string;
//
//   public constructor(options: Readonly<EngineOptions>) {
//     this.bootstrap = options.bootstrap;
//     this.engine = new ngUniversalCommonEngine.CommonEngine(options.bootstrap, options.providers);
//     this.document = options.document;
//   }
//
//   public async render(options: Readonly<RenderOptions>): Promise<string> {
//     return this.engine.render({
//       bootstrap: this.bootstrap,
//       document: this.document,
//       url: options.url,
//       providers: options.providers,
//     });
//   }
// }

async function readTextAsync(filePath: fs.PathLike): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    fs.readFile(filePath, {encoding: "UTF-8"}, (err: NodeJS.ErrnoException | null, text: string): void => {
      if (err !== null) {
        reject(err);
      } else {
        resolve(text);
      }
    });
  });
}
