import { makeStateKey, StateKey } from "@angular/platform-browser";

export type RawConfig = unknown;

export const CONFIG_KEY: StateKey<RawConfig | undefined> = makeStateKey("config");
