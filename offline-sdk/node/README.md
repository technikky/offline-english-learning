# offline-sdk/node — Vendored Node.js + pnpm runtime

## Purpose

Lets a machine with zero internet access install and run this project without reaching npm's registry or nodejs.org.

## Versions pinned for this project (Stage 1)

- Node.js: `v22.14.0` (LTS)
- pnpm: `9.15.9` (activated via Corepack, bundled with Node ≥ 16.9)

## What goes here

This folder is populated by `scripts/vendor-node.sh` (added when the project first needs a true offline install — e.g. before Stage 10 packaging, or before shipping to a school with no internet). It downloads once, on a machine with internet access:

1. The official Node.js binary distribution for each target OS (`node-v22.14.0-win-x64.zip`, `-linux-x64.tar.xz`, `-darwin-x64.tar.gz`).
2. A pnpm store mirror: `pnpm fetch` against this repo's `pnpm-lock.yaml` into `offline-sdk/node/pnpm-store/`, so `pnpm install --offline` (used by `scripts/rebuild.*`) never needs network access.

## Why not committed as binaries yet

Node/pnpm binaries and the full dependency store are multi-hundred-MB and change per platform; per [docs/04-repo-structure.md](../../docs/04-repo-structure.md) these are vendored via a restore script and an external artifact store (not raw git blobs) so `git clone` stays fast. The current development machine already has Node 22.14.0 and pnpm 9.15.9 installed (via Corepack), so Stage 1 development/testing proceeds against those directly. The vendoring script is a Stage 10 (deployment optimization) deliverable, tracked there rather than faked here.

## Restoring on an offline machine (once vendored)

```
offline-sdk/node/<platform>/node/bin/node -v
offline-sdk/node/<platform>/node/bin/corepack enable
pnpm install --offline --store-dir offline-sdk/node/pnpm-store
```
