import { Inject, Injectable } from "@angular/core";

import { MARKTWIN } from "../../server/tokens";
import { MarktwinService } from "./marktwin.service";

@Injectable()
export class ServerMarktwinService extends MarktwinService {
  public constructor(@Inject(MARKTWIN) marktwin: typeof import("@eternal-twin/marktwin")) {
    super(marktwin);
  }
}
