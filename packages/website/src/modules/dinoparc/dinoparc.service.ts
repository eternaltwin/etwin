import { Injectable } from "@angular/core";
import { NullableEtwinDinoparcDinoz } from "@eternal-twin/core/lib/dinoparc/etwin-dinoparc-dinoz";
import { NullableEtwinDinoparcUser } from "@eternal-twin/core/lib/dinoparc/etwin-dinoparc-user";
import { GetDinoparcDinozOptions } from "@eternal-twin/core/lib/dinoparc/get-dinoparc-dinoz-options";
import { GetDinoparcUserOptions } from "@eternal-twin/core/lib/dinoparc/get-dinoparc-user-options";
import { Observable } from "rxjs";

@Injectable()
export abstract class DinoparcService {
  abstract getUser(options: Readonly<GetDinoparcUserOptions>): Observable<NullableEtwinDinoparcUser>;

  abstract getDinoz(options: Readonly<GetDinoparcDinozOptions>): Observable<NullableEtwinDinoparcDinoz>;
}
