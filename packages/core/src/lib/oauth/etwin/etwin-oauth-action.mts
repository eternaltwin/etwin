import { TaggedUnionType } from "kryo/tagged-union";

import { $LinkOauthAction, LinkOauthAction } from "./link-oauth-action.mjs";
import { $LoginOauthAction, LoginOauthAction } from "./login-oauth-action.mjs";


export type EtwinOauthAction =
  LinkOauthAction
  | LoginOauthAction;

export const $EtwinOauthAction: TaggedUnionType<EtwinOauthAction> = new TaggedUnionType<EtwinOauthAction>({
  variants: [$LinkOauthAction, $LoginOauthAction],
  tag: "type",
});
