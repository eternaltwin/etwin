import { TryUnionType } from "kryo/lib/try-union";

import { $EmailAddress, EmailAddress } from "../email/email-address.js";
import { $Username, Username } from "../user/username.js";

export type UserLogin = EmailAddress | Username;

export const $UserLogin: TryUnionType<UserLogin> = new TryUnionType<UserLogin>({
  variants: [$EmailAddress, $Username],
});
