import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { clampToMonthGrid, dayBadges, monthLabel, nextMonth, prevMonth, toYmd } from './date'
import type { CalendarEvent } from './types'
import { deleteEvent, loadEvents, upsertEvent } from './storage'
import { EventDialog } from './EventDialog'
import './calendar.css'

type DialogState =
  | { open: false }
  | { open: true; mode: 'create'; day: Date }
  | { open: true; mode: 'edit'; eventId: string }

export function CalendarApp() {
  const [anchor, setAnchor] = useState(() => new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [dialog, setDialog] = useState<DialogState>({ open: false })
  const [loading, setLoading] = useState(true)
  const [banner, setBanner] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const loaded = await loadEvents()
        if (!cancelled) setEvents(loaded)
      } catch {
        if (!cancelled) setBanner('일정을 불러오지 못했습니다. (API 서버 확인)')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const days = useMemo(() => clampToMonthGrid(anchor), [anchor])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const ev of events) {
      let dayKey = ''
      try {
        const d = parseISO(ev.start)
        dayKey = toYmd(d)
      } catch {
        continue
      }
      const list = map.get(dayKey) ?? []
      list.push(ev)
      map.set(dayKey, list)
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.start.localeCompare(b.start))
    }
    return map
  }, [events])

  const selectedEvent = useMemo(() => {
    if (!dialog.open || dialog.mode !== 'edit') return null
    return events.find((e) => e.id === dialog.eventId) ?? null
  }, [dialog, events])

  return (
    <section className="cal-root">
      {banner ? <div className="cal-banner">{banner}</div> : null}
      <div className="cal-header">
        <div className="cal-header-left">
          <button
            className="cal-btn"
            onClick={() => setAnchor(new Date())}
            type="button"
          >
            오늘
          </button>
          <div className="cal-nav">
            <button
              className="cal-icon-btn"
              onClick={() => setAnchor((d) => prevMonth(d))}
              type="button"
              aria-label="이전 달"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="cal-icon-btn"
              onClick={() => setAnchor((d) => nextMonth(d))}
              type="button"
              aria-label="다음 달"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="cal-title" aria-live="polite">
            {monthLabel(anchor)}
          </div>
        </div>

        <div className="cal-header-right">
          <button
            className="cal-btn cal-primary"
            onClick={() => setDialog({ open: true, mode: 'create', day: new Date() })}
            type="button"
          >
            <Plus size={16} />
            새 일정
          </button>
        </div>
      </div>

      <div className="cal-grid">
        {['일', '월', '화', '수', '목', '금', '토'].map((w) => (
          <div key={w} className="cal-weekday">
            {w}
          </div>
        ))}

        {loading ? (
          <div className="cal-loading" style={{ gridColumn: '1 / -1' }}>
            불러오는 중…
          </div>
        ) : null}

        {days.map((d) => {
          const key = toYmd(d)
          const { isToday: today, isOutOfMonth } = dayBadges(d, anchor)
          const list = eventsByDay.get(key) ?? []

          return (
            <div
              key={key}
              className={['cal-cell', today ? 'is-today' : '', isOutOfMonth ? 'is-dim' : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => setDialog({ open: true, mode: 'create', day: d })}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setDialog({ open: true, mode: 'create', day: d })
                }
              }}
              aria-label={`${format(d, 'M월 d일')} 일정 추가`}
            >
              <div className="cal-cell-top">
                <div className="cal-daynum">{format(d, 'd')}</div>
              </div>

              <div className="cal-events">
                {list.slice(0, 3).map((ev) => (
                  <button
                    key={ev.id}
                    className="cal-event"
                    type="button"
                    style={{
                      borderColor: ev.color ? 'transparent' : undefined,
                      background: ev.color ?? undefined,
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setDialog({ open: true, mode: 'edit', eventId: ev.id })
                    }}
                    title={ev.title}
                  >
                    <span className="cal-event-time">
                      {ev.allDay ? '종일' : safeTime(ev.start)}
                    </span>
                    <span className="cal-event-title">{ev.title}</span>
                  </button>
                ))}
                {list.length > 3 ? (
                  <div className="cal-more">+{list.length - 3}개 더</div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      <EventDialog
        open={dialog.open}
        mode={dialog.open ? dialog.mode : 'create'}
        day={dialog.open && dialog.mode === 'create' ? dialog.day : null}
        event={selectedEvent}
        onClose={() => setDialog({ open: false })}
        onSave={async (ev) => {
          try {
            const saved = await upsertEvent(ev)
            setEvents((prev) => {
              const idx = prev.findIndex((p) => p.id === saved.id)
              if (idx === -1) return [saved, ...prev]
              const copy = prev.slice()
              copy[idx] = saved
              return copy
            })
            setBanner(null)
            setDialog({ open: false })
          } catch {
            setBanner('저장에 실패했습니다. (API 서버/DB 확인)')
          }
        }}
        onDelete={async (id) => {
          try {
            await deleteEvent(id)
            setEvents((prev) => prev.filter((e) => e.id !== id))
            setBanner(null)
            setDialog({ open: false })
          } catch {
            setBanner('삭제에 실패했습니다. (API 서버/DB 확인)')
          }
        }}
      />
    </section>
  )
}

function safeTime(iso: string) {
  try {
    return format(parseISO(iso), 'HH:mm')
  } catch {
    return ''
  }
}

