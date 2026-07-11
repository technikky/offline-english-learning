#!/usr/bin/env node
// Generates a self-signed TLS cert/key pair for LAN HTTPS (Stage 11).
// Requires `openssl` on PATH (bundled with Git for Windows / most Linux distros).
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const tlsDir = path.resolve(__dirname, "../data/tls");
fs.mkdirSync(tlsDir, { recursive: true });

const keyPath = path.join(tlsDir, "server.key");
const certPath = path.join(tlsDir, "server.crt");

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log(`TLS cert already exists at ${tlsDir}, skipping.`);
  process.exit(0);
}

console.log("Generating self-signed TLS certificate (365 days, RSA 2048)...");
execFileSync(
  "openssl",
  [
    "req",
    "-x509",
    "-newkey",
    "rsa:2048",
    "-keyout",
    keyPath,
    "-out",
    certPath,
    "-days",
    "365",
    "-nodes",
    "-subj",
    "/CN=englishclass-server",
    "-addext",
    "subjectAltName=DNS:localhost,IP:127.0.0.1",
  ],
  { stdio: "inherit" },
);

console.log(`Done. Cert: ${certPath}\nKey: ${keyPath}`);
console.log(
  "This cert is self-signed: each client device must be configured to trust it, " +
    "or accept the browser/OS security warning, before HTTPS will work without errors.",
);
