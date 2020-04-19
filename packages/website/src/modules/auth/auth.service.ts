import { Injectable } from "@angular/core";
import { AuthContext } from "@eternal-twin/etwin-api-types/lib/auth/auth-context";
import { Observable } from "rxjs";

@Injectable()
export abstract class AuthService {
  abstract auth(): Observable<AuthContext>;
}
