import { promisify } from "util";

import native from "#native";

declare const MemMailerBox: unique symbol;
declare const SmtpMailerBox: unique symbol;
export type NativeMailerBox = typeof MemMailerBox | typeof SmtpMailerBox;

export abstract class NativeMailer {
  public readonly box: NativeMailerBox;

  constructor(box: NativeMailerBox) {
    this.box = box;
  }
}

export class MemMailer extends NativeMailer {
  private static NEW = promisify(native.mailer.mem.new);

  private constructor(box: typeof MemMailerBox) {
    super(box);
  }

  static async create(): Promise<MemMailer> {
    return new MemMailer(await MemMailer.NEW());
  }
}

export interface SmtpMailerOptions {
  relay: string;
  username: string;
  password: string;
  sender: string;
  headers: readonly SmtpHeader[];
}

export interface SmtpHeader {
  name: string;
  value: string;
}

export class SmtpMailer extends NativeMailer {
  private static NEW = promisify(native.mailer.smtp.new);

  private constructor(box: typeof SmtpMailerBox) {
    super(box);
  }

  static async create(options: Readonly<SmtpMailerOptions>): Promise<SmtpMailer> {
    return new SmtpMailer(await SmtpMailer.NEW(
      options.relay,
      options.username,
      options.password,
      options.sender,
      options.headers,
    ));
  }
}
