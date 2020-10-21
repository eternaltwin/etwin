import { Injectable } from "@angular/core";
import { MaybeCompleteUser } from "@eternal-twin/core/lib/user/maybe-complete-user";
import { UserId } from "@eternal-twin/core/lib/user/user-id";
import { Observable } from "rxjs";

@Injectable()
export abstract class UserService {
  abstract getUserById(userId: UserId): Observable<MaybeCompleteUser | null>;
}
