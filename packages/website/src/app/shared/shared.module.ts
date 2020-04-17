import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";

import { MainLayoutComponent } from "./main-layout.component";
import { SmallLayoutComponent } from "./small-layout.component";

@NgModule({
  declarations: [MainLayoutComponent, SmallLayoutComponent],
  imports: [
    CommonModule,
    RouterModule,
  ],
  exports: [MainLayoutComponent, SmallLayoutComponent, RouterModule],
})
export class SharedModule {
}
