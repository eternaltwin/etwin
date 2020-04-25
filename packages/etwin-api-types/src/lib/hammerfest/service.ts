import { AuthContext } from "../auth/auth-context";
import { HammerfestCredentials } from "./hammerfest-credentials";
import { HammerfestServer } from "./hammerfest-server";
import { HammerfestSession } from "./hammerfest-session";
import { HammerfestSessionKey } from "./hammerfest-session-key";

export interface HammerfestService {
  /**
   * Create a new Hammerfest session from credentials.
   *
   * @param auth Authentication context for the user creating the session.
   * @param options Session creation options
   * @returns Created session
   * @throws Unspecified error on invalid credentials or unreachable server.
   */
  createSession(auth: AuthContext, options: HammerfestCredentials): Promise<HammerfestSession>;

  /**
   * Tests if a session key is still valid.
   *
   * @param auth Authentification context for the `touchSession` action
   * @param server Hammerfest server for the session.
   * @param key Session key
   * @returns Updated session if still valid
   * @throws Unspecified error on expired session or unreachable server.
   */
  testSession(auth: AuthContext, server: HammerfestServer, key: HammerfestSessionKey): Promise<HammerfestSession>;
}
