import { Injectable } from "@angular/core";
import { CompleteUser } from "@eternal-twin/etwin-api-types/lib/user/complete-user";
import { User } from "@eternal-twin/etwin-api-types/lib/user/user";
import { UserId } from "@eternal-twin/etwin-api-types/lib/user/user-id";
import { Observable } from "rxjs";

@Injectable()
export abstract class UserService {
  abstract getUserById(userId: UserId): Observable<User | CompleteUser | null>;
}
