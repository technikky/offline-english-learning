import { test } from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { registerHealthRoute } from "./health";
import { ensureSchema } from "../db/client";

test("GET /health returns ok status and db connection", async () => {
  ensureSchema();
  const app = Fastify();
  registerHealthRoute(app);

  const res = await app.inject({ method: "GET", url: "/health" });
  assert.equal(res.statusCode, 200);

  const body = res.json();
  assert.equal(body.status, "ok");
  assert.equal(body.dbConnected, true);
});
