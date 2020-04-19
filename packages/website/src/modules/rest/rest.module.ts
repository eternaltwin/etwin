import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";

import { RestService } from "./rest.service";

@NgModule({
  imports: [
    HttpClientModule,
  ],
  providers: [
    RestService,
  ],
})
export class RestModule {
}
