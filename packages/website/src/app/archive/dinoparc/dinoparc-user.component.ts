import { Component, Input } from "@angular/core";
import { EtwinDinoparcUser } from "@eternal-twin/core/lib/dinoparc/etwin-dinoparc-user";

@Component({
  selector: "etwin-dinoparc-user",
  templateUrl: "./dinoparc-user.component.html",
  styleUrls: [],
})
export class DinoparcUserComponent {
  @Input()
  public user!: EtwinDinoparcUser;

  constructor() {
  }

  ngOnInit(): void {
  }
}
