// AYNA — Basit in-memory TTL cache.
// Persona çağrıları cache'lenmez (canlı görünmeli). Sadece council sonucu cache'lenir.

import crypto from "node:crypto";

const DEFAULT_TTL_MS = 60_000;

function makeKey(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 32);
}

export class TTLCache {
  constructor({ ttlMs = DEFAULT_TTL_MS, label = "cache" } = {}) {
    this.store = new Map();
    this.ttlMs = ttlMs;
    this.label = label;
  }

  get(rawKey) {
    const key = makeKey(rawKey);
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(rawKey, value) {
    const key = makeKey(rawKey);
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    return key;
  }

  // Demo / debug — kaç giriş ve hashleri.
  size() {
    // Süresi geçenleri temizle.
    const now = Date.now();
    for (const [k, v] of this.store) {
      if (now > v.expiresAt) this.store.delete(k);
    }
    return this.store.size;
  }
}

export const councilCache = new TTLCache({ ttlMs: 60_000, label: "council" });
