import { Injectable } from "@angular/core";
import { MaybeCompleteUser } from "@eternal-twin/core/lib/user/maybe-complete-user";
import { UpdateUserPatch } from "@eternal-twin/core/lib/user/update-user-patch";
import { User } from "@eternal-twin/core/lib/user/user";
import { UserId } from "@eternal-twin/core/lib/user/user-id";
import { Observable } from "rxjs";

@Injectable()
export abstract class UserService {
  abstract getUserById(userId: UserId): Observable<MaybeCompleteUser | null>;

  abstract updateUser(userId: UserId, patch: Readonly<UpdateUserPatch>): Observable<User>;
}
