import { Application } from "./application";
import { Contact } from "./contact";
import { GroupMember } from "./group-member";
import { HtmlText } from "./html-text.js";
import { Like } from "./like.js";
import { Locale } from "./locale.js";
import { OldName } from "./old-name.js";
import { SiteUser } from "./site-user.js";
import { UrlRef } from "./url-ref.js";

export interface User {
  id: number;
  name: string;
  picture?: UrlRef;
  locale: Locale;
  title: string;
  oldNames: OldName[];
  sites: SiteUser[];
  like: Like;
  city: string;
  country: string;
  desc: HtmlText;
  status: HtmlText;
  contacts: Contact[];
  groups: GroupMember[];
  devApps: Application[];
}
