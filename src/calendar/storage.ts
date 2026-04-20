import type { CalendarEvent } from './types'

export async function loadEvents(): Promise<CalendarEvent[]> {
  const res = await fetch('/api/events')
  if (!res.ok) return []
  const data = (await res.json()) as unknown
  if (!Array.isArray(data)) return []
  return data.filter(isEventLike)
}

export async function upsertEvent(ev: CalendarEvent): Promise<CalendarEvent> {
  const res = await fetch(`/api/events/${encodeURIComponent(ev.id)}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(ev),
  })
  if (!res.ok) throw new Error('failed to save')
  return (await res.json()) as CalendarEvent
}

export async function deleteEvent(id: string): Promise<void> {
  const res = await fetch(`/api/events/${encodeURIComponent(id)}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('failed to delete')
}

function isEventLike(value: unknown): value is CalendarEvent {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    typeof v.start === 'string' &&
    typeof v.end === 'string' &&
    typeof v.allDay === 'boolean'
  )
}

