import { Injectable } from "@angular/core";
import { MaybeCompleteUser } from "@eternal-twin/core/user/maybe-complete-user";
import { UnlinkFromDinoparcOptions } from "@eternal-twin/core/user/unlink-from-dinoparc-options";
import { UnlinkFromHammerfestOptions } from "@eternal-twin/core/user/unlink-from-hammerfest-options";
import { UnlinkFromTwinoidOptions } from "@eternal-twin/core/user/unlink-from-twinoid-options";
import { UpdateUserPatch } from "@eternal-twin/core/user/update-user-patch";
import { User } from "@eternal-twin/core/user/user";
import { UserId } from "@eternal-twin/core/user/user-id";
import { Observable } from "rxjs";

@Injectable()
export abstract class UserService {
  abstract getUserById(userId: UserId): Observable<MaybeCompleteUser | null>;

  abstract updateUser(userId: UserId, patch: Readonly<UpdateUserPatch>): Observable<User>;

  abstract unlinkFromDinoparc(options: Readonly<UnlinkFromDinoparcOptions>): Observable<null>;

  abstract unlinkFromHammerfest(options: Readonly<UnlinkFromHammerfestOptions>): Observable<null>;

  abstract unlinkFromTwinoid(options: Readonly<UnlinkFromTwinoidOptions>): Observable<null>;
}
