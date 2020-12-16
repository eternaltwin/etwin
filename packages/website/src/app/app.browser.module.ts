import { APP_BASE_HREF } from "@angular/common";
import { NgModule } from "@angular/core";
import { BrowserTransferStateModule } from "@angular/platform-browser";

import { BrowserAuthModule } from "../modules/auth/auth.module.browser";
import { BrowserConfigModule } from "../modules/config/config.module.browser";
import { BrowserForumModule } from "../modules/forum/forum.module.browser";
import { BrowserHammerfestModule } from "../modules/hammerfest/hammerfest.module.browser";
import { BrowserUserModule } from "../modules/user/user.module.browser";
import { AppComponent } from "./app.component";
import { AppModule } from "./app.module";

@NgModule({
  imports: [
    AppModule,
    BrowserAuthModule,
    BrowserConfigModule,
    BrowserForumModule,
    BrowserHammerfestModule,
    BrowserTransferStateModule,
    BrowserUserModule,
  ],
  providers: [
    {provide: APP_BASE_HREF, useValue: "/"},
  ],
  bootstrap: [AppComponent],
})
export class AppBrowserModule {
}
