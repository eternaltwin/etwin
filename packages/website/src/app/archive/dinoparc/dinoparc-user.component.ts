import { Component, Input } from "@angular/core";
import { DinoparcUser } from "@eternal-twin/core/lib/dinoparc/dinoparc-user";

@Component({
  selector: "etwin-dinoparc-user",
  templateUrl: "./dinoparc-user.component.html",
  styleUrls: [],
})
export class DinoparcUserComponent {
  @Input()
  public user!: DinoparcUser;

  constructor() {
  }

  ngOnInit(): void {
  }
}
