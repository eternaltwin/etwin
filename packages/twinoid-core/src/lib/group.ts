import { GroupMember } from "./group-member";
import { NameRef } from "./name-ref";
import { UrlRef } from "./url-ref";
import { User } from "./user";

export interface Group {
  id: number;
  name: string;
  link: string;
  banner?: UrlRef;
  roles: NameRef[];
  owner: User;
  members: GroupMember[];
  size: number;
}
