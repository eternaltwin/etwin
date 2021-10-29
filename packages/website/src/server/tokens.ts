import { InjectionToken } from "@angular/core";
import { AuthContext } from "@eternal-twin/core/auth/auth-context";
import { Config } from "@eternal-twin/core/config/config";
import { DinoparcService } from "@eternal-twin/core/dinoparc/service";
import { ForumService } from "@eternal-twin/core/forum/service";
import { HammerfestService } from "@eternal-twin/core/hammerfest/service";
import { UserService } from "@eternal-twin/core/user/service";

export const AUTH_CONTEXT: InjectionToken<AuthContext> = new InjectionToken("AuthContext");

export const CONFIG: InjectionToken<Config> = new InjectionToken("Config");

export const DINOPARC: InjectionToken<DinoparcService> = new InjectionToken("DinoparcService");

export const FORUM: InjectionToken<ForumService> = new InjectionToken("ForumService");

export const HAMMERFEST: InjectionToken<HammerfestService> = new InjectionToken("HammerfestService");

export const MARKTWIN: InjectionToken<typeof import("@eternal-twin/marktwin")> = new InjectionToken("Marktwin");

export const TWINOID: InjectionToken<DinoparcService> = new InjectionToken("TwinoidService");

export const USER: InjectionToken<UserService> = new InjectionToken("UserService");
