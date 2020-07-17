import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { HomeView } from "./home/home.component";
import { SharedModule } from "./shared/shared.module";
import { ConfigService } from "../modules/config/config.service";

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
