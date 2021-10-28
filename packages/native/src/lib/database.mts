import { promisify } from "util";

import native from "#native";

export interface DatabaseOptions {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
}

declare const DatabaseBox: unique symbol;

export class Database {
  public readonly box: typeof DatabaseBox;
  private static CLOSE = promisify(native.database.close);
  private static NEW = promisify(native.database.new);

  private constructor(box: typeof DatabaseBox) {
    this.box = box;
  }

  static async create(options: Readonly<DatabaseOptions>): Promise<Database> {
    const rawOptions: string = JSON.stringify({
      host: options.host,
      port: options.port,
      name: options.name,
      user: options.user,
      password: options.password,
    });
    const box = await Database.NEW(rawOptions);
    return new Database(box);
  }

  async close(): Promise<null> {
    await Database.CLOSE(this.box);
    return null;
  }
}
