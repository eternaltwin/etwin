import { APP_BASE_HREF } from "@angular/common";
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppComponent } from "./app.component";
import { AppModule } from "./app.module";

@NgModule({
  imports: [
    AppModule,
    BrowserModule,
  ],
  providers: [
    {provide: APP_BASE_HREF, useValue: "/"},
  ],
  bootstrap: [AppComponent],
})
export class AppBrowserModule {
}
