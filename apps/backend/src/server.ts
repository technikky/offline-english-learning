import Fastify from "fastify";
import { ensureSchema } from "./db/client";
import { registerHealthRoute } from "./routes/health";

const PORT = Number(process.env.PORT ?? 4310);
const HOST = process.env.HOST ?? "127.0.0.1";

async function main() {
  ensureSchema();

  const app = Fastify({ logger: true });
  registerHealthRoute(app);

  await app.listen({ port: PORT, host: HOST });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
