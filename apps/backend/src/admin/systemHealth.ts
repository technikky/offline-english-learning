import type { SystemHealthResponse } from "@englishclass/types";
import { sqlite } from "../db/client";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8100";
const LANGUAGE_TOOL_URL = process.env.LANGUAGE_TOOL_URL ?? "http://127.0.0.1:8081";

const processStartTime = Date.now();

// A quick unreachable-service timeout so one down dependency (e.g. the AI
// service still starting up) doesn't hang the whole dashboard.
async function fetchWithTimeout(url: string, timeoutMs = 2000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function getSystemHealth(): Promise<SystemHealthResponse> {
  let dbConnected = false;
  try {
    sqlite.prepare("SELECT 1").get();
    dbConnected = true;
  } catch {
    dbConnected = false;
  }

  const [aiService, languageTool] = await Promise.all([
    (async () => {
      try {
        const res = await fetchWithTimeout(`${AI_SERVICE_URL}/health`);
        const body = await res.json();
        return {
          name: "ai-service",
          reachable: res.ok,
          modelLoaded: body.modelLoaded,
          modelPath: body.modelPath,
          threadCount: body.threadCount,
        };
      } catch (err) {
        return { name: "ai-service", reachable: false, detail: (err as Error).message };
      }
    })(),
    (async () => {
      try {
        const res = await fetchWithTimeout(`${LANGUAGE_TOOL_URL}/v2/languages`);
        return { name: "languagetool", reachable: res.ok };
      } catch (err) {
        return { name: "languagetool", reachable: false, detail: (err as Error).message };
      }
    })(),
  ]);

  return {
    backend: {
      dbConnected,
      uptimeSeconds: Math.floor((Date.now() - processStartTime) / 1000),
    },
    aiService,
    languageTool,
  };
}
