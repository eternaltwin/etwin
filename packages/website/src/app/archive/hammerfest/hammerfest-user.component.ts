import { Component, Input } from "@angular/core";
import { HammerfestUser } from "@eternal-twin/core/lib/hammerfest/hammerfest-user";

@Component({
  selector: "etwin-hammerfest-user",
  templateUrl: "./hammerfest-user.component.html",
  styleUrls: [],
})
export class HammerfestUserComponent {
  @Input()
  public user!: HammerfestUser;

  constructor() {
  }

  ngOnInit(): void {
  }
}
