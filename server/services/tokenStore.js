import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

const DB_DIR = path.resolve(process.cwd(), 'server', 'data');
const DB_FILE = path.join(DB_DIR, 'tokens.json');

const ALGO = 'aes-256-gcm';
const KEY = process.env.TOKEN_ENCRYPTION_KEY || process.env.DESCOPE_MANAGEMENT_KEY || 'dev-key-please-change-0123456789abcdef';

async function ensureDbDir() {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
  } catch (e) {
    // ignore
  }
}

function deriveKey(key) {
  return crypto.createHash('sha256').update(key).digest();
}

function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, deriveKey(KEY), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(b64) {
  try {
    const data = Buffer.from(b64, 'base64');
    const iv = data.slice(0, 12);
    const tag = data.slice(12, 28);
    const encrypted = data.slice(28);
    const decipher = crypto.createDecipheriv(ALGO, deriveKey(KEY), iv);
    decipher.setAuthTag(tag);
    const out = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return out.toString('utf8');
  } catch (e) {
    console.error('Failed to decrypt token', e?.message || e);
    return null;
  }
}

let inMemory = null;

async function load() {
  if (inMemory) return inMemory;
  await ensureDbDir();
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8');
    inMemory = JSON.parse(raw);
  } catch (e) {
    inMemory = { tokens: [] };
    await save();
  }
  return inMemory;
}

async function save() {
  const tmp = DB_FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(inMemory, null, 2), 'utf8');
  await fs.rename(tmp, DB_FILE);
}

export async function saveToken(userId, provider, tokenObj = {}) {
  const db = await load();
  const existing = db.tokens.find((t) => t.userId === userId && t.provider === provider);
  const record = {
    userId,
    provider,
    scope: tokenObj.scope || null,
    expiresAt: tokenObj.expiresAt || null,
    updatedAt: new Date().toISOString(),
    createdAt: existing ? existing.createdAt : new Date().toISOString(),
    accessToken: tokenObj.accessToken ? encrypt(tokenObj.accessToken) : existing?.accessToken || null,
    refreshToken: tokenObj.refreshToken ? encrypt(tokenObj.refreshToken) : existing?.refreshToken || null,
  };
  if (existing) {
    const idx = db.tokens.indexOf(existing);
    db.tokens[idx] = { ...existing, ...record };
  } else {
    db.tokens.push(record);
  }
  await save();
  return { ok: true };
}

export async function getToken(userId, provider) {
  const db = await load();
  const rec = db.tokens.find((t) => t.userId === userId && t.provider === provider);
  if (!rec) return null;
  return {
    userId: rec.userId,
    provider: rec.provider,
    scope: rec.scope,
    expiresAt: rec.expiresAt,
    createdAt: rec.createdAt,
    updatedAt: rec.updatedAt,
    accessToken: rec.accessToken ? decrypt(rec.accessToken) : null,
    refreshToken: rec.refreshToken ? decrypt(rec.refreshToken) : null,
  };
}

export async function deleteToken(userId, provider) {
  const db = await load();
  db.tokens = db.tokens.filter((t) => !(t.userId === userId && t.provider === provider));
  await save();
  return { ok: true };
}

export async function getMetadata(userId) {
  const db = await load();
  const tokens = db.tokens.filter((t) => t.userId === userId);
  const meta = {};
  for (const t of tokens) meta[t.provider] = { has: true, expiresAt: t.expiresAt };
  return meta;
}

export default { saveToken, getToken, deleteToken, getMetadata };
