import Koa from "koa";
import koaLogger from "koa-logger";

async function main(): Promise<void> {
  const app: Koa = new Koa();
  const port: number = 50320;

  app.use(koaLogger());

  app.use((ctx: Koa.Context) => {
    ctx.response.status = 404;
    ctx.body = {error: "ResourceNotFound"};
  });

  app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
  });
}

main()
  .catch((err: Error): never => {
    console.error(err.stack);
    process.exit(1);
  });
