import { NgModule } from "@angular/core";

import { RestModule } from "../rest/rest.module";
import { ForumService } from "./forum.service";
import { BrowserForumService } from "./forum.service.browser";

@NgModule({
  providers: [
    {provide: ForumService, useClass: BrowserForumService},
  ],
  imports: [
    RestModule,
  ],
})
export class BrowserForumModule {
}
