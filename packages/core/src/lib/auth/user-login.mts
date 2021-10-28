import { TryUnionType } from "kryo/try-union";

import { $EmailAddress, EmailAddress } from "../email/email-address.mjs";
import { $Username, Username } from "../user/username.mjs";

export type UserLogin = EmailAddress | Username;

export const $UserLogin: TryUnionType<UserLogin> = new TryUnionType<UserLogin>({
  variants: [$EmailAddress, $Username],
});
