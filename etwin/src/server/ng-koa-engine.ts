import { ɵCommonEngine as CommonEngine } from "@nguniversal/common/engine";
import * as sysPath from "path";
import * as fs from "fs";
import { NgModuleFactory, Type } from "@angular/core";

export interface EngineOptions {
  baseDir: string;
  bootstrap: Type<{}> | NgModuleFactory<{}>;
}

export class NgKoaEngine {
  private readonly document: string;
  private readonly commonEngine: CommonEngine;
  private readonly bootstrap: Type<{}> | NgModuleFactory<{}>;

  public static async create(options: EngineOptions): Promise<NgKoaEngine> {
    const indexPath = sysPath.join(options.baseDir, "index.html");
    const indexHtml = await readTextAsync(indexPath);
    return new NgKoaEngine(options, indexHtml);
  }

  private constructor(options: EngineOptions, document: string) {
    this.commonEngine = new CommonEngine(options.bootstrap, []);
    this.document = document;
  }

  public async render(): Promise<string> {
    return this.commonEngine.render({
      bootstrap: this.bootstrap,
      document: this.document,
      url: "http://localhost:4200/",
      providers: [],
    });
  }
}

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
