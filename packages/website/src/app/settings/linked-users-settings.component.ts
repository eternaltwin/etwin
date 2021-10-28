import { Component, Input } from "@angular/core";
import { VersionedLinks } from "@eternal-twin/core/link/versioned-links";
import { UserId } from "@eternal-twin/core/user/user-id";

@Component({
  selector: "etwin-linked-users-settings",
  templateUrl: "./linked-users-settings.component.html",
  styleUrls: [],
})
export class LinkedUsersSettingsComponent {
  @Input()
  public links!: VersionedLinks;

  @Input()
  public userId!: UserId;

  constructor() {
  }
}
