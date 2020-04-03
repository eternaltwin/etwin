import { UserAuthContext } from "./user-auth-context";
import { GuestAuthContext } from "./guest-auth-context";

export type AuthContext = GuestAuthContext | UserAuthContext;
