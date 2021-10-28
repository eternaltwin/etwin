import { Component, Input } from "@angular/core";
import { EtwinDinoparcDinoz } from "@eternal-twin/core/dinoparc/etwin-dinoparc-dinoz";

@Component({
  selector: "etwin-dinoparc-dinoz",
  templateUrl: "./dinoparc-dinoz.component.html",
  styleUrls: [],
})
export class DinoparcDinozComponent {
  @Input()
  public dinoz!: EtwinDinoparcDinoz;

  constructor() {
  }

  ngOnInit(): void {
  }
}
