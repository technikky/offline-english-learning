import fs from "node:fs";
import path from "node:path";
import type { AiModelInfo } from "@englishclass/types";
import { dataDir } from "../db/client";

const modelsDir = path.resolve(dataDir, "../offline-sdk/ai-models");
const selectionFilePath = path.join(dataDir, "ai-model-config.json");

function readSelectedFilename(): string | null {
  if (!fs.existsSync(selectionFilePath)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(selectionFilePath, "utf-8"));
    return typeof raw.modelPath === "string" ? path.basename(raw.modelPath) : null;
  } catch {
    return null;
  }
}

// Lists vendored GGUF models the admin can pick between. Picking one writes
// data/ai-model-config.json, which the AI service's model.py checks ahead of
// AI_MODEL_PATH on its next startup -- switching models still requires
// restarting that process (a single in-memory llama.cpp instance can't be
// hot-swapped safely mid-request), so this is model *selection*, not live
// hot-swapping. See docs/15-stage12-plan.md.
export function listAiModels(): AiModelInfo[] {
  if (!fs.existsSync(modelsDir)) return [];
  const selected = readSelectedFilename();

  return fs
    .readdirSync(modelsDir)
    .filter((filename) => filename.endsWith(".gguf"))
    .map((filename) => {
      const stat = fs.statSync(path.join(modelsDir, filename));
      return {
        filename,
        sizeBytes: stat.size,
        isActive: selected ? selected === filename : false,
      };
    });
}

export function selectAiModel(filename: string): void {
  const safeName = path.basename(filename);
  const modelPath = path.join(modelsDir, safeName);
  if (!fs.existsSync(modelPath)) {
    throw new Error(`Model file not found: ${safeName}`);
  }

  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(selectionFilePath, JSON.stringify({ modelPath }, null, 2));
}
