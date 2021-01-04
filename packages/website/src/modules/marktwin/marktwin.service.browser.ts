import { Injectable } from "@angular/core";
import * as marktwin from "@eternal-twin/marktwin";

import { MarktwinService } from "./marktwin.service";

@Injectable()
export class BrowserMarktwinService extends MarktwinService {
  public constructor() {
    super(marktwin);
  }
}
