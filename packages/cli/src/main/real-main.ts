import { run } from "../lib/index.js";

async function main(): Promise<void> {
  const args: readonly string[] = process.argv.slice(2);
  const exitCode = await run(args);
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

main()
  .catch((err: Error): never => {
    console.error(err.stack);
    process.exit(1);
  });
