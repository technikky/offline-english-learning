import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve(__dirname, "../../../data");

// TLS is opt-in: a self-signed cert requires every client (Electron, Flutter)
// to explicitly trust it, which is a per-device deployment step outside this
// codebase's control. Default stays plain HTTP so today's dev workflow is
// unchanged. See docs/14-stage11-plan.md.
export function readTlsOptions(): { key: Buffer; cert: Buffer } | null {
  if (process.env.TLS_ENABLED !== "true") return null;

  const keyPath = process.env.TLS_KEY_PATH ?? path.join(dataDir, "tls", "server.key");
  const certPath = process.env.TLS_CERT_PATH ?? path.join(dataDir, "tls", "server.crt");

  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    throw new Error(
      `TLS_ENABLED=true but cert/key not found at ${keyPath} / ${certPath}. ` +
        "Run scripts/generate-tls-cert.js first.",
    );
  }

  return { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
}
