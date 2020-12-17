import { Component, Input } from "@angular/core";
import { DinoparcServer } from "@eternal-twin/core/lib/dinoparc/dinoparc-server";
import { VersionedDinoparcLink } from "@eternal-twin/core/lib/link/versioned-dinoparc-link";
import { UserId } from "@eternal-twin/core/lib/user/user-id";

@Component({
  selector: "etwin-linked-dinoparc-settings",
  templateUrl: "./linked-dinoparc-settings.component.html",
  styleUrls: [],
})
export class LinkedDinoparcSettingsComponent {
  @Input()
  public link!: VersionedDinoparcLink;

  @Input()
  public server!: DinoparcServer;

  @Input()
  public userId!: UserId;

  constructor() {
  }
}
