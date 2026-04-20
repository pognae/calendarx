import express from 'express'
import { db } from './db'

const app = express()
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/events', (_req, res) => {
  const rows = db
    .prepare(
      `select id, title, start, end, allDay, color, notes from events order by start asc`,
    )
    .all()
  res.json(rows.map(fromRow))
})

app.put('/api/events/:id', (req, res) => {
  const id = String(req.params.id ?? '')
  const body = req.body as unknown
  const parsed = parseEvent(body, id)
  if (!parsed.ok) return res.status(400).json({ error: parsed.error })

  const now = new Date().toISOString()
  const exists = db.prepare(`select id from events where id = ?`).get(id)

  if (exists) {
    db.prepare(
      `update events
       set title = ?, start = ?, end = ?, allDay = ?, color = ?, notes = ?, updatedAt = ?
       where id = ?`,
    ).run(
      parsed.event.title,
      parsed.event.start,
      parsed.event.end,
      parsed.event.allDay ? 1 : 0,
      parsed.event.color ?? null,
      parsed.event.notes ?? null,
      now,
      id,
    )
  } else {
    db.prepare(
      `insert into events (id, title, start, end, allDay, color, notes, createdAt, updatedAt)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      parsed.event.title,
      parsed.event.start,
      parsed.event.end,
      parsed.event.allDay ? 1 : 0,
      parsed.event.color ?? null,
      parsed.event.notes ?? null,
      now,
      now,
    )
  }

  res.json(parsed.event)
})

app.delete('/api/events/:id', (req, res) => {
  const id = String(req.params.id ?? '')
  db.prepare(`delete from events where id = ?`).run(id)
  res.json({ ok: true })
})

const port = Number(process.env.PORT ?? 5176)
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://localhost:${port}`)
})

type ApiEvent = {
  id: string
  title: string
  start: string
  end: string
  allDay: boolean
  color?: string
  notes?: string
}

function fromRow(row: any): ApiEvent {
  return {
    id: String(row.id),
    title: String(row.title),
    start: String(row.start),
    end: String(row.end),
    allDay: !!row.allDay,
    color: row.color == null ? undefined : String(row.color),
    notes: row.notes == null ? undefined : String(row.notes),
  }
}

function parseEvent(value: unknown, id: string): { ok: true; event: ApiEvent } | { ok: false; error: string } {
  if (!value || typeof value !== 'object') return { ok: false, error: 'body must be object' }
  const v = value as Record<string, unknown>

  const title = typeof v.title === 'string' ? v.title.trim() : ''
  const start = typeof v.start === 'string' ? v.start : ''
  const end = typeof v.end === 'string' ? v.end : ''
  const allDay = typeof v.allDay === 'boolean' ? v.allDay : false
  const color = typeof v.color === 'string' ? v.color : undefined
  const notes = typeof v.notes === 'string' ? v.notes : undefined

  if (!id) return { ok: false, error: 'id is required' }
  if (!title) return { ok: false, error: 'title is required' }
  if (!isIsoLike(start) || !isIsoLike(end)) return { ok: false, error: 'start/end must be ISO strings' }

  return { ok: true, event: { id, title, start, end, allDay, color, notes } }
}

function isIsoLike(s: string) {
  // allow toISOString() output; keep it permissive.
  return typeof s === 'string' && s.length >= 10 && s.includes('T')
}

