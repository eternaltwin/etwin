import { $DinoparcCredentials, DinoparcCredentials } from "@eternal-twin/core/lib/dinoparc/dinoparc-credentials.js";
import readline from "readline";

export async function promptCredentials(): Promise<DinoparcCredentials> {
  const cliInterface: readline.ReadLine = readline.createInterface(
    process.stdin,
    process.stdout,
  );

  const server: string = await new Promise<string>(
    (resolve: (res: string) => void, _reject: (err: any) => void): void => {
      cliInterface.question("Server? ", resolve);
    },
  );

  const username: string = await new Promise<string>(
    (resolve: (res: string) => void, _reject: (err: any) => void): void => {
      cliInterface.question("Username? ", resolve);
    },
  );

  const password: string = await new Promise<string>(
    (resolve: (res: string) => void, _reject: (err: any) => void): void => {
      cliInterface.question("Password? ", resolve);
    },
  );

  const result: Promise<DinoparcCredentials> = new Promise(
    (resolve: (res: DinoparcCredentials) => void, reject: (err: Error) => void): void => {
      cliInterface.once("error", (err: Error): void => {
        reject(err);
      });
      cliInterface.once("close", (): void => {
        const credentials = {server, username, password};
        if ($DinoparcCredentials.test(credentials)) {
          resolve(credentials);
        } else {
          reject(new Error("InvalidCredentials"));
        }
      });
    },
  );

  cliInterface.close();
  return result;
}

export async function promptEnter(): Promise<void> {
  const cliInterface: readline.ReadLine = readline.createInterface(process.stdin, process.stdout);

  await new Promise<string>((resolve, _): void => cliInterface.question("Press [Enter] to continue", resolve));

  const result: Promise<void> = new Promise((resolve, reject): void => {
    cliInterface.once("error", reject);
    cliInterface.once("close", resolve);
  });

  cliInterface.close();
  return result;
}
