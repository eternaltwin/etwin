import { makeStateKey, StateKey } from "@angular/platform-browser";

export type RawAuthContext = unknown;

export const AUTH_CONTEXT_KEY: StateKey<RawAuthContext | undefined> = makeStateKey("auth_context");
