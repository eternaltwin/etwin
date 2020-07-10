import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";

import { EtwinBarComponent } from "./etwin-bar.component";
import { LanguagePickerComponent } from "./language-picker.component";
import { MainLayoutComponent } from "./main-layout.component";
import { PaginationComponent } from "./pagination.component";
import { SmallLayoutComponent } from "./small-layout.component";
import { UserLinkComponent } from "./user-link.component";

@NgModule({
  declarations: [EtwinBarComponent, LanguagePickerComponent, MainLayoutComponent, PaginationComponent, SmallLayoutComponent, UserLinkComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
  ],
  exports: [MainLayoutComponent, SmallLayoutComponent, RouterModule, PaginationComponent, UserLinkComponent],
})
export class SharedModule {
}
