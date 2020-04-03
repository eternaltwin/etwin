import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { HomeView } from "./home/home.component";

@NgModule({
  imports: [
    AppRoutingModule,
    BrowserModule.withServerTransition({appId: "etwin"}),
    CommonModule,
  ],
  declarations: [AppComponent, HomeView],
  exports: [AppComponent],
})
export class AppModule {
}
