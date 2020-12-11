import { NgModule } from "@angular/core";

import { SharedModule } from "../shared/shared.module";
import { GamesComponent } from "./games.component";
import { GamesRoutingModule } from "./games-routing.module";

@NgModule({
  declarations: [GamesComponent],
  imports: [
    GamesRoutingModule,
    SharedModule,
  ],
})
export class GamesModule {
}
