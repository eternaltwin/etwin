import { Injectable } from "@angular/core";
import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context";
import { RawCredentials } from "@eternal-twin/core/lib/auth/raw-credentials";
import { RegisterWithUsernameOptions } from "@eternal-twin/core/lib/auth/register-with-username-options";
import { HammerfestCredentials } from "@eternal-twin/core/lib/hammerfest/hammerfest-credentials";
import { User } from "@eternal-twin/core/lib/user/user";
import { Observable } from "rxjs";

@Injectable()
export abstract class AuthService {
  abstract auth(): Observable<AuthContext>;

  abstract registerWithUsername(options: Readonly<RegisterWithUsernameOptions>): Observable<User>;

  abstract loginWithCredentials(options: Readonly<RawCredentials>): Observable<User>;

  abstract loginWithHammerfestCredentials(credentials: Readonly<HammerfestCredentials>): Observable<User>;

  abstract logout(): Observable<null>;
}
