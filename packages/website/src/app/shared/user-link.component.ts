import { Component, Input } from "@angular/core";
import { UserRef } from "@eternal-twin/core/lib/user/user-ref";

@Component({
  selector: "etwin-user-link",
  templateUrl: "./user-link.component.html",
  styleUrls: [],
})
export class UserLinkComponent {
  @Input()
  public user!: UserRef;

  constructor() {
  }
}
