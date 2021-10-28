import { Injectable } from "@angular/core";
import { GetTwinoidUserOptions } from "@eternal-twin/core/twinoid/get-twinoid-user-options";
import { TwinoidUser } from "@eternal-twin/core/twinoid/twinoid-user";
import { Observable } from "rxjs";

@Injectable()
export abstract class TwinoidService {
  abstract getUser(options: Readonly<GetTwinoidUserOptions>): Observable<TwinoidUser | null>;
}
