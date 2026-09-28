import { DatabaseSync } from 'node:sqlite';

export type Db = DatabaseSync;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS parents (
  id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, pass_hash TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY, parent_id TEXT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS children (
  id TEXT PRIMARY KEY, parent_id TEXT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  name TEXT NOT NULL, kg INTEGER NOT NULL, avatar TEXT NOT NULL,
  stage INTEGER NOT NULL DEFAULT 1, stage_since TEXT NOT NULL, level INTEGER NOT NULL DEFAULT 1,
  recording_consent INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS children_parent ON children(parent_id);
CREATE TABLE IF NOT EXISTS practice_sessions (
  id TEXT PRIMARY KEY, child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  date TEXT NOT NULL, started_at INTEGER NOT NULL, duration_sec INTEGER NOT NULL, levels TEXT NOT NULL,
  smooth INTEGER NOT NULL, bumpy INTEGER NOT NULL, corrections INTEGER NOT NULL, note TEXT NOT NULL,
  updated_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS ps_child ON practice_sessions(child_id, updated_at);
CREATE TABLE IF NOT EXISTS ratings (
  child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE, date TEXT NOT NULL,
  value INTEGER NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (child_id, date));
CREATE TABLE IF NOT EXISTS item_progress (
  child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE, item_id TEXT NOT NULL,
  box INTEGER NOT NULL, due_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
  PRIMARY KEY (child_id, item_id));
CREATE TABLE IF NOT EXISTS stickers (
  child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE, sticker_id TEXT NOT NULL,
  earned_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (child_id, sticker_id));
CREATE TABLE IF NOT EXISTS recordings (
  id TEXT PRIMARY KEY, child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL, duration_sec INTEGER NOT NULL, mime TEXT NOT NULL, file TEXT NOT NULL);
`;

export function openDb(file: string): Db {
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 3000;');
  db.exec(SCHEMA);
  return db;
}
