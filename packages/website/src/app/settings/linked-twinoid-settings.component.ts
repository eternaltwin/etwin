import { Component, Input } from "@angular/core";
import { VersionedTwinoidLink } from "@eternal-twin/core/lib/link/versioned-twinoid-link";

@Component({
  selector: "etwin-linked-twinoid-settings",
  templateUrl: "./linked-twinoid-settings.component.html",
  styleUrls: [],
})
export class LinkedTwinoidSettingsComponent {
  @Input()
  public link!: VersionedTwinoidLink;

  constructor() {
  }
}
