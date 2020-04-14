import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { SmallLayoutComponent } from "./small-layout.component";
import { RouterModule } from "@angular/router";

@NgModule({
  declarations: [SmallLayoutComponent],
  imports: [
    CommonModule,
    RouterModule,
  ],
  exports: [SmallLayoutComponent, RouterModule],
})
export class SharedModule {
}
