import { TryUnionType } from "kryo/lib/try-union.js";

import { $EmailAddress, EmailAddress } from "../email/email-address.js";
import { $Username, Username } from "../user/username.js";

export type Login = EmailAddress | Username;

export const $Login: TryUnionType<Login> = new TryUnionType<Login>({
  variants: [$EmailAddress, $Username],
});
