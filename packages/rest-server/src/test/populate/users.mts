import { $RegisterWithUsernameOptions } from "@eternal-twin/core/auth/register-with-username-options";
import { $SimpleUser, SimpleUser } from "@eternal-twin/core/user/simple-user";
import { UserDisplayName } from "@eternal-twin/core/user/user-display-name";
import { Username } from "@eternal-twin/core/user/username";
import { Buffer } from "buffer";
import chai from "chai";
import http from "http";

import { TestAgent } from "../test-agent.mjs";

export interface PopulatedUsers {
  alice: SimpleUser;
  aliceAgent: TestAgent;
  bob: SimpleUser;
  bobAgent: TestAgent;
  charlie: SimpleUser;
  charlieAgent: TestAgent;
}

export interface UserAndAgent {
  user: SimpleUser;
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
  const user: SimpleUser = await agent.post(
    "/users",
    $RegisterWithUsernameOptions,
    {
      username,
      displayName,
      password: Buffer.from(passwordStr),
    },
    $SimpleUser,
  );
  return {user, agent};
}
