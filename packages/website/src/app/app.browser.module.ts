import { APP_BASE_HREF } from "@angular/common";
import { NgModule } from "@angular/core";
import { BrowserTransferStateModule } from "@angular/platform-browser";

import { BrowserAuthModule } from "../modules/auth/auth.module.browser";
import { AppComponent } from "./app.component";
import { AppModule } from "./app.module";

@NgModule({
  imports: [
    AppModule,
    BrowserAuthModule,
    BrowserTransferStateModule,
  ],
  providers: [
    {provide: APP_BASE_HREF, useValue: "/"},
  ],
  bootstrap: [AppComponent],
})
export class AppBrowserModule {
}
