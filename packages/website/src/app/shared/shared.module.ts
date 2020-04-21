import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";

import { EtwinBarComponent } from "./etwin-bar.component";
import { MainLayoutComponent } from "./main-layout.component";
import { SmallLayoutComponent } from "./small-layout.component";

@NgModule({
  declarations: [EtwinBarComponent, MainLayoutComponent, SmallLayoutComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
  ],
  exports: [MainLayoutComponent, SmallLayoutComponent, RouterModule],
})
export class SharedModule {
}
