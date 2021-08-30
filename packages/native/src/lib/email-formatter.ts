import { promisify } from "util";

import native from "../native/index.js";

declare const HtmlEmailFormatterBox: unique symbol;
declare const JsonEmailFormatterBox: unique symbol;
export type NativeEmailFormatterBox = typeof HtmlEmailFormatterBox | typeof JsonEmailFormatterBox;

export abstract class NativeEmailFormatter {
  public readonly box: NativeEmailFormatterBox;

  constructor(box: NativeEmailFormatterBox) {
    this.box = box;
  }
}

export class HtmlEmailFormatter extends NativeEmailFormatter {
  private static NEW = promisify(native.emailFormatter.html.new);

  private constructor(box: typeof HtmlEmailFormatterBox) {
    super(box);
  }

  static async create(): Promise<HtmlEmailFormatter> {
    return new HtmlEmailFormatter(await HtmlEmailFormatter.NEW());
  }
}

export class JsonEmailFormatter extends NativeEmailFormatter {
  private static NEW = promisify(native.emailFormatter.json.new);

  private constructor(box: typeof JsonEmailFormatterBox) {
    super(box);
  }

  static async create(): Promise<JsonEmailFormatter> {
    return new JsonEmailFormatter(await JsonEmailFormatter.NEW());
  }
}
