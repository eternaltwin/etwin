import { NgModule } from "@angular/core";

import { ForumService } from "./forum.service";
import { ServerForumService } from "./forum.service.server";

@NgModule({
  providers: [
    {provide: ForumService, useClass: ServerForumService},
  ],
  imports: [],
})
export class ServerForumModule {
}
