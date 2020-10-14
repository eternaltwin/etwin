import { HttpHammerfestClientService } from "../lib/index.js";
import { Credentials, promptCredentials } from "./cli.js";

async function main() {
  const hammefestClient = new HttpHammerfestClientService();
  const {username, password}: Credentials = await promptCredentials();
  const s = await hammefestClient.createSession({
    server: "hammerfest.fr",
    login: username,
    password: Buffer.from(password)
  });
  console.log(s);
  const profile = await hammefestClient.getProfileById(s, {server: "hammerfest.fr", userId: s.user.id});
  console.log(profile);
}

main();
