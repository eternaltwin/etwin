import { HttpRequest, HttpResponse, HttpRouter } from "@eternal-twin/core/http/index";
import { promisify } from "util";

import native from "#native";

import { NativeDinoparcService } from "./services/dinoparc.mjs";
import { NativeHammerfestService } from "./services/hammerfest.mjs";

declare const NativeRestRouterBox: unique symbol;

export interface NativeRestRouterOptions {
  dinoparc: NativeDinoparcService;
  hammerfest: NativeHammerfestService;
}

export class NativeRestRouter implements HttpRouter {
  private static NEW = promisify(native.rest.new);
  private static HANDLE = promisify(native.rest.handle);

  public readonly box: typeof NativeRestRouterBox;

  private constructor(box: typeof NativeRestRouterBox) {
    this.box = box;
  }

  public static async create(options: Readonly<NativeRestRouterOptions>): Promise<NativeRestRouter> {
    const box = await NativeRestRouter.NEW(options.dinoparc.box, options.hammerfest.box);
    return new NativeRestRouter(box);
  }

  async handle(req: Readonly<HttpRequest>): Promise<HttpResponse> {
    return await NativeRestRouter.HANDLE(this.box, req);
  }
}
