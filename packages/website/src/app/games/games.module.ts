import { NgModule } from "@angular/core";

import { SharedModule } from "../shared/shared.module";
import { GamesRoutingModule } from "./games-routing.module";
import { GamesComponent } from "./games.component";

@NgModule({
  declarations: [GamesComponent],
  imports: [
    GamesRoutingModule,
    SharedModule,
  ],
})
export class GamesModule {
}
