import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { ConfigService } from "../modules/config/config.service";
import { AppComponent } from "./app.component";
import { AppRoutingModule } from "./app-routing.module";
import { HomeView } from "./home/home.component";
import { SharedModule } from "./shared/shared.module";

@NgModule({
  imports: [
    AppRoutingModule,
    BrowserModule.withServerTransition({appId: "etwin"}),
    CommonModule,
    SharedModule,
  ],
  declarations: [AppComponent, HomeView],
  exports: [AppComponent],
})
export class AppModule {
  readonly #config: ConfigService;

  // Force the following services to be instantiated at the root
  constructor(config: ConfigService) {
    this.#config = config;
    // if (config === null || config === undefined) {
    //   console.warn("MissingConfig");
    // }
    // console.log(config);
  }
}
