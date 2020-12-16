import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { SharedModule } from "../shared/shared.module";
import { ArchiveHomeView } from "./archive-home.view";
import { ArchiveRoutingModule } from "./archive-routing.module";

@NgModule({
  declarations: [ArchiveHomeView],
  imports: [
    CommonModule,
    ArchiveRoutingModule,
    SharedModule,
  ],
})
export class ArchiveModule {
}
