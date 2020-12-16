import { Injectable } from "@angular/core";
import { GetHammerfestUserOptions } from "@eternal-twin/core/lib/hammerfest/get-hammerfest-user-options";
import { HammerfestUser } from "@eternal-twin/core/lib/hammerfest/hammerfest-user";
import { Observable } from "rxjs";

@Injectable()
export abstract class HammerfestService {
  abstract getUser(options: Readonly<GetHammerfestUserOptions>): Observable<HammerfestUser | null>;
}
