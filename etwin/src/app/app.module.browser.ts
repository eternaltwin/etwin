import { BrowserTransferStateModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { AppComponent } from "./app.component";
import { BrowserApiModule } from "../modules/api/api.module.browser";
import { AppModule } from "./app.module";

@NgModule({
  imports: [
    AppModule,
    BrowserApiModule,
    BrowserTransferStateModule,
  ],
  bootstrap: [AppComponent],
})
export class BrowserAppModule {
}
