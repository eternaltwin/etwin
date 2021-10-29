import { Component, Input } from "@angular/core";
import { VersionedTwinoidLink } from "@eternal-twin/core/link/versioned-twinoid-link";
import { UserId } from "@eternal-twin/core/user/user-id";

@Component({
  selector: "etwin-linked-twinoid-settings",
  templateUrl: "./linked-twinoid-settings.component.html",
  styleUrls: [],
})
export class LinkedTwinoidSettingsComponent {
  @Input()
  public link!: VersionedTwinoidLink;

  @Input()
  public userId!: UserId;

  constructor() {
  }
}
