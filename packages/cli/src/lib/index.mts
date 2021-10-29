import { runDb } from "./db.mjs";
import { runStart } from "./start.mjs";

export async function run(args: readonly string[]): Promise<number> {
  if (args.length === 0) {
    return runStart(args);
  } else {
    const [command, ...newWrgs] = args;
    switch (command) {
      case "db":
        return runDb(newWrgs);
      case "start":
        return runStart(newWrgs);
      default:
        console.error(`Unknown command: ${JSON.stringify(command)}`);
        return 1;
    }
  }
}
