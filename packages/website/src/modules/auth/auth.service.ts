import { Injectable } from "@angular/core";
import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context";
import { RawUserCredentials } from "@eternal-twin/core/lib/auth/raw-user-credentials";
import { RegisterWithUsernameOptions } from "@eternal-twin/core/lib/auth/register-with-username-options";
import { DinoparcCredentials } from "@eternal-twin/core/lib/dinoparc/dinoparc-credentials";
import { HammerfestCredentials } from "@eternal-twin/core/lib/hammerfest/hammerfest-credentials";
import { User } from "@eternal-twin/core/lib/user/user";
import { Observable } from "rxjs";

@Injectable()
export abstract class AuthService {
  abstract auth(): Observable<AuthContext>;

  abstract registerWithUsername(options: Readonly<RegisterWithUsernameOptions>): Observable<User>;

  abstract loginWithCredentials(options: Readonly<RawUserCredentials>): Observable<User>;

  abstract loginWithDinoparcCredentials(credentials: Readonly<DinoparcCredentials>): Observable<User>;

  abstract loginWithHammerfestCredentials(credentials: Readonly<HammerfestCredentials>): Observable<User>;

  abstract logout(): Observable<null>;
}
