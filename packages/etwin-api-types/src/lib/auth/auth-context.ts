import { GuestAuthContext } from "./guest-auth-context";
import { UserAuthContext } from "./user-auth-context";

export type AuthContext = GuestAuthContext | UserAuthContext;
