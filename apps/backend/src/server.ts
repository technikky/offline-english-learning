import Fastify from "fastify";
import { ensureSchema } from "./db/client";
import { registerHealthRoute } from "./routes/health";
import { registerAuthRoutes } from "./routes/auth";
import { registerAdminRoutes } from "./routes/admin";
import { registerTeacherRoutes } from "./routes/teacher";
import { registerConversationRoutes } from "./routes/conversations";
import { bootstrapAdminIfNeeded } from "./auth/bootstrap";

const PORT = Number(process.env.PORT ?? 4310);
const HOST = process.env.HOST ?? "127.0.0.1";

async function main() {
  ensureSchema();

  const app = Fastify({ logger: true });

  await bootstrapAdminIfNeeded(app.log);

  registerHealthRoute(app);
  registerAuthRoutes(app);
  registerAdminRoutes(app);
  registerTeacherRoutes(app);
  registerConversationRoutes(app);

  await app.listen({ port: PORT, host: HOST });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
