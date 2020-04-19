import { Component } from "@angular/core";
import { AuthContext } from "@eternal-twin/etwin-api-types/lib/auth/auth-context";
import { AuthType } from "@eternal-twin/etwin-api-types/lib/auth/auth-type";
import { Observable } from "rxjs";

import { AuthService } from "../../modules/auth/auth.service";

@Component({
  selector: "etwin-bar",
  templateUrl: "./etwin-bar.component.html",
  styleUrls: [],
})
export class EtwinBarComponent {
  public readonly AuthType = AuthType;
  public readonly auth$: Observable<AuthContext>;

  constructor(auth: AuthService) {
    this.auth$ = auth.auth();
  }
}
