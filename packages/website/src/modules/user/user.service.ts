import { Injectable } from "@angular/core";
import { CompleteUser } from "@eternal-twin/core/lib/user/complete-user";
import { User } from "@eternal-twin/core/lib/user/user";
import { UserId } from "@eternal-twin/core/lib/user/user-id";
import { Observable } from "rxjs";

@Injectable()
export abstract class UserService {
  abstract getUserById(userId: UserId): Observable<User | CompleteUser | null>;
}