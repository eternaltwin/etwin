import { Api } from "@eternal-twin/core/lib/api.js";
import { UserId } from "@eternal-twin/core/lib/user/user-id.js";
import { User } from "@eternal-twin/core/lib/user/user.js";

export class InMemoryApi implements Api {
  private readonly users: Map<UserId, User>;

  constructor() {
    this.users = new Map();
  }

  public async getUserById(_clientSecret: string, _authToken: string, userId: string): Promise<User | null> {
    return this.users.get(userId) ?? null;
  }

  public addInMemoryUser(user: User): void {
    this.users.set(user.id, user);
  }
}
