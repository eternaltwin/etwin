import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { BrowserModule } from "@angular/platform-browser";

@NgModule({
  imports: [
    AppRoutingModule,
    BrowserModule.withServerTransition({appId: "etwin"}),
    CommonModule,
  ],
  declarations: [AppComponent],
  exports: [AppComponent],
})
export class AppModule {
}
