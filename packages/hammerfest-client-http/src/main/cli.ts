import readline from "readline";

export interface Credentials {
  username: string;
  password: string;
}

export async function promptCredentials(): Promise<Credentials> {
  const cliInterface: readline.ReadLine = readline.createInterface(
    process.stdin,
    process.stdout,
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

  const result: Promise<Credentials> = new Promise(
    (resolve: (res: Credentials) => void, reject: (err: Error) => void): void => {
      cliInterface.once("error", (err: Error): void => {
        reject(err);
      });
      cliInterface.once("close", (): void => {
        resolve({username, password});
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
