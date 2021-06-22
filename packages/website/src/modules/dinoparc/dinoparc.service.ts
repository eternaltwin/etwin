import { Injectable } from "@angular/core";
import { NullableEtwinDinoparcUser } from "@eternal-twin/core/lib/dinoparc/etwin-dinoparc-user";
import { GetDinoparcUserOptions } from "@eternal-twin/core/lib/dinoparc/get-dinoparc-user-options";
import { Observable } from "rxjs";

@Injectable()
export abstract class DinoparcService {
  abstract getUser(options: Readonly<GetDinoparcUserOptions>): Observable<NullableEtwinDinoparcUser>;
}
