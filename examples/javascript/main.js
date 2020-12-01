import { $ShortUser } from "@eternal-twin/core/lib/user/short-user.js";
import { HttpEtwinClient } from "@eternal-twin/etwin-client-http";
import { PRETTY_JSON_WRITER } from "kryo-json/lib/json-writer.js";
import * as url from "url";

async function main() {
  const client = new HttpEtwinClient(new url.URL("https://eternal-twin.net/"));
  const user = await client.getUserById(null, "9f310484-963b-446b-af69-797feec6813f");
  console.log($ShortUser.write(PRETTY_JSON_WRITER, user));
}

main();
