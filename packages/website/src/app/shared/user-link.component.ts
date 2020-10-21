import { Component, Input } from "@angular/core";
import { ShortUser } from "@eternal-twin/core/lib/user/short-user";

@Component({
  selector: "etwin-user-link",
  templateUrl: "./user-link.component.html",
  styleUrls: [],
})
export class UserLinkComponent {
  @Input()
  public user!: ShortUser;

  constructor() {
  }
}
