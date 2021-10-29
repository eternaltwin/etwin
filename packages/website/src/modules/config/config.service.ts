import { Injectable } from "@angular/core";
import { ForumConfig } from "@eternal-twin/core/forum/forum-config";

@Injectable({providedIn: "root"})
export abstract class ConfigService {
  abstract forum(): ForumConfig;
}
