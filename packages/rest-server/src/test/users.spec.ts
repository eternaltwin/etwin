import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { $CompleteSimpleUser, CompleteSimpleUser } from "@eternal-twin/core/lib/user/complete-simple-user.js";
import { $SimpleUser, SimpleUser } from "@eternal-twin/core/lib/user/simple-user.js";
import chai from "chai";
import chaiHttp from "chai-http";

import { populateUsers } from "./populate/users.js";
import { TestAgent } from "./test-agent.js";
import { withTestServer } from "./test-server.js";

chai.use(chaiHttp);

describe("/users", () => {
  it("should create two users and retrieve them", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withTestServer(async ({server}) => {
      const guestAgent: TestAgent = new TestAgent(chai.request.agent(server));
      const {alice, aliceAgent, bob, bobAgent} = await populateUsers(server);
      {
        const actual: CompleteSimpleUser = await aliceAgent.get(`/users/${alice.id}`, $CompleteSimpleUser);
        const expected: CompleteSimpleUser = {
          type: ObjectType.User,
          id: alice.id,
          displayName: {current: {value: "Alice"}},
          isAdministrator: true,
          ctime: actual.ctime,
          username: "alice",
          emailAddress: null,
          hasPassword: true,
        };
        chai.assert.deepEqual(actual, expected);
      }
      {
        const actual: SimpleUser = await bobAgent.get(`/users/${alice.id}`, $SimpleUser);
        const expected: SimpleUser = {
          type: ObjectType.User,
          id: alice.id,
          displayName: {current: {value: "Alice"}},
          isAdministrator: true,
        };
        chai.assert.deepEqual(actual, expected);
      }
      {
        const actual: SimpleUser = await guestAgent.get(`/users/${alice.id}`, $SimpleUser);
        const expected: SimpleUser = {
          type: ObjectType.User,
          id: alice.id,
          displayName: {current: {value: "Alice"}},
          isAdministrator: true,
        };
        chai.assert.deepEqual(actual, expected);
      }
      {
        const actual: CompleteSimpleUser = await aliceAgent.get(`/users/${bob.id}`, $CompleteSimpleUser);
        const expected: CompleteSimpleUser = {
          type: ObjectType.User,
          id: bob.id,
          displayName: {current: {value: "Bob"}},
          isAdministrator: false,
          ctime: actual.ctime,
          username: "bob",
          emailAddress: null,
          hasPassword: true,
        };
        chai.assert.deepEqual(actual, expected);
      }
      {
        const actual: CompleteSimpleUser = await bobAgent.get(`/users/${bob.id}`, $CompleteSimpleUser);
        const expected: CompleteSimpleUser = {
          type: ObjectType.User,
          id: bob.id,
          displayName: {current: {value: "Bob"}},
          isAdministrator: false,
          ctime: actual.ctime,
          username: "bob",
          emailAddress: null,
          hasPassword: true,
        };
        chai.assert.deepEqual(actual, expected);
      }
      {
        const actual: SimpleUser = await guestAgent.get(`/users/${bob.id}`, $SimpleUser);
        const expected: SimpleUser = {
          type: ObjectType.User,
          id: bob.id,
          displayName: {current: {value: "Bob"}},
          isAdministrator: false,
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });
});
