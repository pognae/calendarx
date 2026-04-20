import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'

const dataDir = path.join(process.cwd(), 'server', 'data')
fs.mkdirSync(dataDir, { recursive: true })

const dbPath = path.join(dataDir, 'calendarx.db')
export const db = new Database(dbPath)

db.pragma('journal_mode = WAL')

db.exec(`
  create table if not exists events (
    id text primary key,
    title text not null,
    start text not null,
    end text not null,
    allDay integer not null,
    color text,
    notes text,
    createdAt text not null,
    updatedAt text not null
  );
  create index if not exists idx_events_start on events(start);
`)

