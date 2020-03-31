import { NgModule } from "@angular/core";
import { HttpClientModule } from "@angular/common/http";
import { AnnouncementService } from "./announcement.service";
import { BrowserAnnouncementService } from "./announcement.service.browser";

@NgModule({
  imports: [
    HttpClientModule,
  ],
  providers: [
    {provide: AnnouncementService, useClass: BrowserAnnouncementService},
  ],
})
export class BrowserApiModule {
}
