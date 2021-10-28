import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Data as AnyRouteData } from "@angular/router";
import { EtwinDinoparcDinoz, NullableEtwinDinoparcDinoz } from "@eternal-twin/core/dinoparc/etwin-dinoparc-dinoz";
import { NEVER as RX_NEVER, Observable } from "rxjs";
import { map as rxMap } from "rxjs/operators";

const DINOPARC_DINOZ_NOT_FOUND: unique symbol = Symbol("DINOPARC_DINOZ_NOT_FOUND");

export interface DinoparcDinozRouteData {
  dinoz: NullableEtwinDinoparcDinoz;
}

@Component({
  selector: "etwin-dinoparc-dinoz-view",
  templateUrl: "./dinoparc-dinoz.view.html",
  styleUrls: [],
})
export class DinoparcDinozView implements OnInit {
  public dinoz$: Observable<EtwinDinoparcDinoz | typeof DINOPARC_DINOZ_NOT_FOUND>;
  public readonly DINOPARC_DINOZ_NOT_FOUND = DINOPARC_DINOZ_NOT_FOUND;

  readonly #route: ActivatedRoute;

  public constructor(route: ActivatedRoute) {
    this.#route = route;
    this.dinoz$ = RX_NEVER;
  }

  ngOnInit(): void {
    this.dinoz$ = this.#route.data
      .pipe(rxMap((anyData: AnyRouteData): EtwinDinoparcDinoz | typeof DINOPARC_DINOZ_NOT_FOUND => {
        const data = anyData as DinoparcDinozRouteData;
        return data.dinoz !== null ? data.dinoz : DINOPARC_DINOZ_NOT_FOUND;
      }));
  }
}
