import { Component, Input } from "@angular/core";
import { HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server";
import { VersionedHammerfestLink } from "@eternal-twin/core/lib/link/versioned-hammerfest-link";
import { UserId } from "@eternal-twin/core/lib/user/user-id";

@Component({
  selector: "etwin-linked-hammerfest-settings",
  templateUrl: "./linked-hammerfest-settings.component.html",
  styleUrls: [],
})
export class LinkedHammerfestSettingsComponent {
  @Input()
  public link!: VersionedHammerfestLink;

  @Input()
  public server!: HammerfestServer;

  @Input()
  public userId!: UserId;

  constructor() {
  }
}
