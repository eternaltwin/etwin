import { EtwinClientService } from "@eternal-twin/core/lib/etwin-client/service.js";
import { $ShortUser, ShortUser } from "@eternal-twin/core/lib/user/short-user.js";
import { HttpEtwinClient } from "@eternal-twin/etwin-client-http";
import { PRETTY_JSON_WRITER } from "kryo-json/lib/json-writer.js";
import * as url from "url";

export async function main(): Promise<void> {
  const client: EtwinClientService = new HttpEtwinClient(new url.URL("https://eternal-twin.net/"));
  const user: ShortUser = await client.getUserById(null, "9f310484-963b-446b-af69-797feec6813f");
  console.log($ShortUser.write(PRETTY_JSON_WRITER, user));
}
