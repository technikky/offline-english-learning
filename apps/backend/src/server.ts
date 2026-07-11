import Fastify from "fastify";
import fastifyRateLimit from "@fastify/rate-limit";
import { readTlsOptions } from "./tls";
import { ensureSchema } from "./db/client";
import { registerHealthRoute } from "./routes/health";
import { registerAuthRoutes } from "./routes/auth";
import { registerAdminRoutes } from "./routes/admin";
import { registerTeacherRoutes } from "./routes/teacher";
import { registerConversationRoutes } from "./routes/conversations";
import { registerGrammarRoutes } from "./routes/grammar";
import { registerVocabularyRoutes } from "./routes/vocabulary";
import { registerAssignmentRoutes } from "./routes/assignments";
import { registerTeacherReviewRoutes } from "./routes/teacherReview";
import { registerReportRoutes } from "./routes/reports";
import { registerAnalyticsRoutes } from "./routes/analytics";
import { registerSpeechRoutes } from "./routes/speech";
import { bootstrapAdminIfNeeded } from "./auth/bootstrap";

const PORT = Number(process.env.PORT ?? 4310);
const HOST = process.env.HOST ?? "127.0.0.1";

async function main() {
  ensureSchema();

  const https = readTlsOptions();

  // Default 1MB body limit is too small for base64-encoded audio recordings.
  const app = Fastify({
    logger: true,
    bodyLimit: 25 * 1024 * 1024,
    ...(https ? { https } : {}),
  });

  // Global default is generous (this is a LAN app, not public internet); the
  // brute-force-relevant routes (login/refresh) set a much stricter override.
  await app.register(fastifyRateLimit, {
    max: 300,
    timeWindow: "1 minute",
  });

  await bootstrapAdminIfNeeded(app.log);

  registerHealthRoute(app);
  registerAuthRoutes(app);
  registerAdminRoutes(app);
  registerTeacherRoutes(app);
  registerConversationRoutes(app);
  registerGrammarRoutes(app);
  registerVocabularyRoutes(app);
  registerAssignmentRoutes(app);
  registerTeacherReviewRoutes(app);
  registerReportRoutes(app);
  registerAnalyticsRoutes(app);
  registerSpeechRoutes(app);

  await app.listen({ port: PORT, host: HOST });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
