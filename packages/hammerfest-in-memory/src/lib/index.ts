import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { HammerfestClientService } from "@eternal-twin/core/lib/hammerfest/client.js";
import { HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server.js";
import { HammerfestUserRef } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-ref.js";
import { HammerfestService } from "@eternal-twin/core/lib/hammerfest/service.js";

export class InMemoryHammerfestService implements HammerfestService {
  private readonly hammerfestClient: HammerfestClientService;

  constructor(hammerfestClient: HammerfestClientService) {
    this.hammerfestClient = hammerfestClient;
  }

  async getUserById(_acx: AuthContext, server: HammerfestServer, userId: string): Promise<HammerfestUserRef | null> {
    const profile = await this.hammerfestClient.getProfileById(null, {server, userId});
    return profile !== null ? profile.user : null;
  }
}
