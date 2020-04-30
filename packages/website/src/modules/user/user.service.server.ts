import { Injectable } from "@angular/core";
import { CompleteUser } from "@eternal-twin/core/lib/user/complete-user";
import { User } from "@eternal-twin/core/lib/user/user";
import { UserId } from "@eternal-twin/core/lib/user/user-id";
import { Observable } from "rxjs";

import { UserService } from "./user.service";

@Injectable()
export class ServerUserService extends UserService {
  constructor() {
    super();
  }

  getUserById(userId: UserId): Observable<User | CompleteUser | null> {
    throw new Error("NotImplemented");
  }
}
