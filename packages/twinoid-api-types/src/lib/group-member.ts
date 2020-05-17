import { Group } from "./group";
import { GroupRole } from "./group-role";
import { User } from "./user.js";

export interface GroupMember {
  group: Group;
  user: User;
  title: string;
  role: GroupRole;
}
