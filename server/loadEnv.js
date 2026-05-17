// AYNA — Çok ufak bir .env yükleyici. dotenv bağımlılığından kaçınmak için.
// Node 20.6+ --env-file=.env desteği var, ama doğrudan `node server/index.js`
// çalıştırmasını da destekleyelim.

import fs from "node:fs";
import path from "node:path";

export function loadDotEnv(cwd = process.cwd()) {
  if (process.env.AYNA_SKIP_DOTENV === "1") return false;
  const envPath = path.resolve(cwd, ".env");
  if (!fs.existsSync(envPath)) return false;

  const raw = fs.readFileSync(envPath, "utf-8");
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/i);
    if (!m) continue;
    const key = m[1];
    let value = m[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined || process.env[key] === "") {
      process.env[key] = value;
    }
  }
  return true;
}
