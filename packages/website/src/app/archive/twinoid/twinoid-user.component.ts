import { Component, Input } from "@angular/core";
import { TwinoidUser } from "@eternal-twin/core/twinoid/twinoid-user";

@Component({
  selector: "etwin-twinoid-user",
  templateUrl: "./twinoid-user.component.html",
  styleUrls: [],
})
export class TwinoidUserComponent {
  @Input()
  public user!: TwinoidUser;

  constructor() {
  }

  ngOnInit(): void {
  }
}
