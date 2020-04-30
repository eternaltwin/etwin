import { $RegisterWithUsernameOptions } from "@eternal-twin/core/lib/auth/register-with-username-options.js";
import { UserDisplayName } from "@eternal-twin/core/lib/user/user-display-name.js";
import { $User, User } from "@eternal-twin/core/lib/user/user.js";
import { Username } from "@eternal-twin/core/lib/user/username.js";
import chai from "chai";
import http from "http";

import { TestAgent } from "../test-agent.js";

export interface PopulatedUsers {
  alice: User;
  aliceAgent: TestAgent;
  bob: User;
  bobAgent: TestAgent;
  charlie: User;
  charlieAgent: TestAgent;
}

export interface UserAndAgent {
  user: User;
  agent: TestAgent;
}

export async function populateUsers(server: http.Server): Promise<PopulatedUsers> {
  const {user: alice, agent: aliceAgent} = await createUserAndAgent(server, "alice", "Alice", "aaaaaaaaaa");
  const {user: bob, agent: bobAgent} = await createUserAndAgent(server, "bob", "Bob", "bbbbbbbbbb");
  const {user: charlie, agent: charlieAgent} = await createUserAndAgent(server, "charlie", "Charlie", "cccccccccc");
  return {
    alice,
    aliceAgent,
    bob,
    bobAgent,
    charlie,
    charlieAgent,
  };
}

export async function createUserAndAgent(
  server: http.Server,
  username: Username,
  displayName: UserDisplayName,
  passwordStr: string,
): Promise<UserAndAgent> {
  const agent: TestAgent = new TestAgent(chai.request.agent(server));
  const user: User = await agent.post(
    "/users",
    $RegisterWithUsernameOptions,
    {
      username,
      displayName,
      password: Buffer.from(passwordStr),
    },
    $User,
  );
  return {user, agent};
}
