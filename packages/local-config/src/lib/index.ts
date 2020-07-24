import findUp from "find-up";
import fs from "fs";
import toml from "toml";
import url from "url";

export interface Config {
  etwin: EtwinConfig;
  db: DbConfig;
  clients: Map<string, ClientConfig>
  auth: AuthConfig;
  forum: ForumConfig;
}

export enum ApiType {
  Postgres,
  InMemory,
}

export interface EtwinConfig {
  api: ApiType;

  /**
   * Secret key used to encrypt sensitive DB columns (password hashes, emails) or sign JWTs.
   */
  secret: string;

  /**
   * Internal HTTP port
   */
  httpPort: number;

  /**
   * Public URI of the server
   */
  externalUri: url.URL;
}

export interface DbConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
}

export interface ClientConfig {
  displayName: string;
  appUri: url.URL;
  callbackUri: url.URL;
  secret: string;
}

export interface AuthConfig {
  twinoid: TwinoidAuthConfig;
}

export interface TwinoidAuthConfig {
  clientId: string;
  secret: string;
}

export interface ForumConfig {
  postsPerPage: number;
  threadsPerPage: number;
  sections: Map<string, ForumSectionConfig>;
}

export interface ForumSectionConfig {
  displayName: string;
  locale: "en-US" | "eo" | "es-SP" | "fr-FR" | null;
}

function parseConfig(input: string): Config {
  const raw: unknown = toml.parse(input);
  return readConfig(raw);
}

function readConfig(raw: unknown): Config {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Expected config root to be an object");
  }
  const rawEtwin: object = readObj(raw, "etwin", "etwin");
  const etwin: EtwinConfig = readEtwinConfig(rawEtwin);
  const rawDb: object = readObj(raw, "db", "db");
  const db: DbConfig = readDbConfig(rawDb);
  const rawClients: object | null = readOptObj(raw, "clients", "clients");
  const clients: Map<string, ClientConfig> = new Map();
  if (rawClients !== null) {
    for (const [key, value] of Object.entries(rawClients)) {
      const clientConfig: ClientConfig = readClientConfig(value, `clients.${key}`);
      clients.set(key, clientConfig);
    }
  }
  const rawAuth: object = readObj(raw, "auth", "auth");
  const auth: AuthConfig = readAuthConfig(rawAuth);
  const rawForum: object = readObj(raw, "forum", "forum");
  const forum: ForumConfig = readForumConfig(rawForum);
  return {etwin, db, clients, auth, forum};
}

function readEtwinConfig(raw: object): EtwinConfig {
  const rawApiType: string = readString(raw, "api", "etwin.api");
  let api: ApiType;
  switch (rawApiType) {
    case "postgres":
      api = ApiType.Postgres;
      break;
    case "in-memory":
      api = ApiType.InMemory;
      break;
    default:
      throw new Error("Invalid API type, expected \"postgres\" or \"in-memory\"");
  }
  const secret: string = readString(raw, "secret", "etwin.secret");
  const httpPort: number = readUint(raw, "http_port", "etwin.http_port");
  const rawExternalUri: string = readString(raw, "external_uri", "etwin.external_uri");
  const externalUri = Object.freeze(new url.URL(rawExternalUri));
  return {api, secret, httpPort, externalUri};
}

function readDbConfig(raw: object): DbConfig {
  const host: string = readString(raw, "host", "db.host");
  const port: number = readUint(raw, "port", "db.port");
  const name: string = readString(raw, "name", "db.name");
  const user: string = readString(raw, "user", "db.user");
  const password: string = readString(raw, "password", "db.password");
  return {host, port, name, user, password};
}

function readClientConfig(raw: unknown, prefix: string): ClientConfig {
  if (typeof raw !== "object" || raw === null) {
    throw new Error(`Expected client config to be an object: ${prefix}`);
  }
  const displayName: string = readString(raw, "display_name", `${prefix}.display_name`);
  const rawAppUri: string = readString(raw, "app_uri", `${prefix}.app_uri`);
  const appUri = Object.freeze(new url.URL(rawAppUri));
  const rawCallbackUri: string = readString(raw, "callback_uri", `${prefix}.callback_uri`);
  const callbackUri = Object.freeze(new url.URL(rawCallbackUri));
  const secret: string = readString(raw, "secret", "etwin.secret");
  return {displayName, appUri, callbackUri, secret};
}

function readAuthConfig(raw: object): AuthConfig {
  const rawTwinoid: object = readObj(raw, "twinoid", "auth.twinoid");
  const twinoid: TwinoidAuthConfig = readTwinoidAuthConfig(rawTwinoid);
  return {twinoid};
}

function readTwinoidAuthConfig(raw: object): TwinoidAuthConfig {
  const clientId: string = readString(raw, "client_id", "auth.twinoid.client_id");
  const secret: string = readString(raw, "secret", "auth.twinoid.secret");
  return {clientId, secret};
}

function readForumConfig(raw: object): ForumConfig {
  const postsPerPage: number = readUint(raw, "posts_per_page", "forum.posts_per_page");
  const threadsPerPage: number = readUint(raw, "threads_per_page", "forum.threads_per_page");
  const rawSections: object | null = readOptObj(raw, "sections", "forum.sections");
  const sections: Map<string, ForumSectionConfig> = new Map();
  if (rawSections !== null) {
    for (const [key, value] of Object.entries(rawSections)) {
      const sectionConfig: ForumSectionConfig = readForumSectionConfig(value, `forum.sections.${key}`);
      sections.set(key, sectionConfig);
    }
  }
  return {postsPerPage, threadsPerPage, sections};
}

const supportedLocales: ReadonlySet<"en-US" | "eo" | "es-SP" | "fr-FR"> = new Set(["en-US", "eo", "es-SP", "fr-FR"]);

function readForumSectionConfig(raw: unknown, prefix: string): ForumSectionConfig {
  if (typeof raw !== "object" || raw === null) {
    throw new Error(`Expected forum section config to be an object: ${prefix}`);
  }
  const displayName: string = readString(raw, "display_name", `${prefix}.display_name`);
  const locale: string = readString(raw, "locale", `${prefix}.locale`);
  if (!supportedLocales.has(locale as any)) {
    throw new Error(`AssertionError: Only ${[...supportedLocales].join(", ")} locales are allowed`);
  }
  return {displayName, locale: locale as any};
}

function readObj(rawObj: object, key: string, fullKey: string): object {
  if (!Reflect.has(rawObj, key)) {
    throw new Error(`Missing config: ${fullKey}`);
  }
  const value: unknown = Reflect.get(rawObj, key);
  if (typeof value !== "object" || value === null) {
    throw new Error(`Invalid config type, expected object: ${fullKey}`);
  }
  return value;
}

function readOptObj(rawObj: object, key: string, fullKey: string): object | null {
  if (!Reflect.has(rawObj, key)) {
    return null;
  }
  const value: unknown = Reflect.get(rawObj, key);
  if (typeof value !== "object" || value === null) {
    throw new Error(`Invalid config type, expected object: ${fullKey}`);
  }
  return value;
}

function readString(rawObj: object, key: string, fullKey: string): string {
  if (!Reflect.has(rawObj, key)) {
    throw new Error(`Missing config: ${fullKey}`);
  }
  const value: unknown = Reflect.get(rawObj, key);
  if (typeof value !== "string") {
    throw new Error(`Invalid config type, expected string: ${fullKey}`);
  }
  return value;
}

function readUint(rawObj: object, key: string, fullKey: string): number {
  if (!Reflect.has(rawObj, key)) {
    throw new Error(`Missing config: ${fullKey}`);
  }
  const value: unknown = Reflect.get(rawObj, key);
  if (typeof value !== "number" || !(value >= 0) || Math.floor(value) !== value) {
    throw new Error(`Invalid config type, expected positive integer: ${fullKey}`);
  }
  return value;
}

export async function getLocalConfig(): Promise<Config> {
  const cwd: string = process.cwd();
  const configPath: string | undefined = await findUp("etwin.toml", {cwd});
  if (configPath === undefined) {
    throw new Error(`Config file \`etwin.toml\` not found from ${cwd}`);
  }
  const configText: string = await fs.promises.readFile(configPath, {encoding: "utf-8"});
  return parseConfig(configText);
}
