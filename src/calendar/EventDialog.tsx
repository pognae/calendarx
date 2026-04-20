import { useEffect, useMemo, useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import { addMinutes, format, isAfter, parseISO, set } from 'date-fns'
import type { CalendarEvent } from './types'

const DEFAULT_COLORS = ['#7c3aed', '#2563eb', '#059669', '#ea580c', '#db2777', '#475569']

export function EventDialog(props: {
  open: boolean
  mode: 'create' | 'edit'
  day: Date | null
  event: CalendarEvent | null
  onClose: () => void
  onSave: (ev: CalendarEvent) => void
  onDelete: (id: string) => void
}) {
  const { open, mode, day, event, onClose, onSave, onDelete } = props

  const initial = useMemo(() => {
    if (mode === 'edit' && event) return fromEvent(event)
    if (day) return fromDay(day)
    return fromDay(new Date())
  }, [mode, event, day])

  const [title, setTitle] = useState(initial.title)
  const [date, setDate] = useState(initial.date)
  const [allDay, setAllDay] = useState(initial.allDay)
  const [startTime, setStartTime] = useState(initial.startTime)
  const [endTime, setEndTime] = useState(initial.endTime)
  const [color, setColor] = useState<string>(initial.color)
  const [notes, setNotes] = useState(initial.notes)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTitle(initial.title)
    setDate(initial.date)
    setAllDay(initial.allDay)
    setStartTime(initial.startTime)
    setEndTime(initial.endTime)
    setColor(initial.color)
    setNotes(initial.notes)
    setError(null)
  }, [open, initial])

  if (!open) return null

  const canDelete = mode === 'edit' && event

  return (
    <div className="cal-modal-overlay" role="dialog" aria-modal="true">
      <div className="cal-modal">
        <div className="cal-modal-header">
          <div className="cal-modal-title">{mode === 'edit' ? '일정 수정' : '새 일정'}</div>
          <button className="cal-icon-btn" type="button" onClick={onClose} aria-label="닫기">
            <X size={18} />
          </button>
        </div>

        <div className="cal-form">
          <label className="cal-field">
            <div className="cal-label">제목</div>
            <input
              className="cal-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 회의, 운동, 생일"
              autoFocus
            />
          </label>

          <div className="cal-row">
            <label className="cal-field">
              <div className="cal-label">날짜</div>
              <input
                className="cal-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>

            <label className="cal-field cal-checkbox">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
              />
              <span>종일</span>
            </label>
          </div>

          {!allDay ? (
            <div className="cal-row">
              <label className="cal-field">
                <div className="cal-label">시작</div>
                <input
                  className="cal-input"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </label>
              <label className="cal-field">
                <div className="cal-label">종료</div>
                <input
                  className="cal-input"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </label>
            </div>
          ) : null}

          <div className="cal-field">
            <div className="cal-label">색상</div>
            <div className="cal-color-row">
              {DEFAULT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={['cal-color', color === c ? 'is-selected' : ''].filter(Boolean).join(' ')}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  aria-label={`색상 ${c}`}
                />
              ))}
            </div>
          </div>

          <label className="cal-field">
            <div className="cal-label">메모</div>
            <textarea
              className="cal-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="장소, 링크, 아젠다 등"
              rows={4}
            />
          </label>

          {error ? <div className="cal-error">{error}</div> : null}
        </div>

        <div className="cal-modal-footer">
          {canDelete ? (
            <button
              className="cal-btn cal-danger"
              type="button"
              onClick={() => onDelete(event!.id)}
            >
              <Trash2 size={16} />
              삭제
            </button>
          ) : (
            <div />
          )}

          <div className="cal-footer-actions">
            <button className="cal-btn" type="button" onClick={onClose}>
              취소
            </button>
            <button
              className="cal-btn cal-primary"
              type="button"
              onClick={() => {
                const trimmed = title.trim()
                if (!trimmed) {
                  setError('제목을 입력해 주세요.')
                  return
                }

                const built = buildEvent({
                  existingId: mode === 'edit' && event ? event.id : null,
                  title: trimmed,
                  date,
                  allDay,
                  startTime,
                  endTime,
                  color,
                  notes,
                })
                if (!built.ok) {
                  setError(built.error)
                  return
                }
                onSave(built.event)
              }}
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function fromDay(day: Date) {
  const start = set(day, { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 })
  const end = addMinutes(start, 60)
  return {
    title: '',
    date: format(day, 'yyyy-MM-dd'),
    allDay: false,
    startTime: format(start, 'HH:mm'),
    endTime: format(end, 'HH:mm'),
    color: DEFAULT_COLORS[0],
    notes: '',
  }
}

function fromEvent(ev: CalendarEvent) {
  try {
    const start = parseISO(ev.start)
    const end = parseISO(ev.end)
    return {
      title: ev.title ?? '',
      date: format(start, 'yyyy-MM-dd'),
      allDay: !!ev.allDay,
      startTime: format(start, 'HH:mm'),
      endTime: format(end, 'HH:mm'),
      color: ev.color ?? DEFAULT_COLORS[0],
      notes: ev.notes ?? '',
    }
  } catch {
    return fromDay(new Date())
  }
}

function buildEvent(input: {
  existingId: string | null
  title: string
  date: string
  allDay: boolean
  startTime: string
  endTime: string
  color: string
  notes: string
}): { ok: true; event: CalendarEvent } | { ok: false; error: string } {
  const day = safeParseDate(input.date)
  if (!day) return { ok: false, error: '날짜가 올바르지 않습니다.' }

  let start: Date
  let end: Date
  if (input.allDay) {
    start = set(day, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 })
    end = set(day, { hours: 23, minutes: 59, seconds: 0, milliseconds: 0 })
  } else {
    const [sh, sm] = parseHm(input.startTime)
    const [eh, em] = parseHm(input.endTime)
    if (sh == null || sm == null || eh == null || em == null) {
      return { ok: false, error: '시간이 올바르지 않습니다.' }
    }
    start = set(day, { hours: sh, minutes: sm, seconds: 0, milliseconds: 0 })
    end = set(day, { hours: eh, minutes: em, seconds: 0, milliseconds: 0 })
    if (!isAfter(end, start)) {
      return { ok: false, error: '종료 시간이 시작 시간보다 늦어야 합니다.' }
    }
  }

  const ev: CalendarEvent = {
    id: input.existingId ?? crypto.randomUUID(),
    title: input.title,
    start: start.toISOString(),
    end: end.toISOString(),
    allDay: input.allDay,
    color: input.color,
    notes: input.notes.trim() ? input.notes : undefined,
  }
  return { ok: true, event: ev }
}

function safeParseDate(ymd: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const dt = new Date(y, mo - 1, d)
  if (Number.isNaN(dt.getTime())) return null
  return dt
}

function parseHm(hm: string): [number | null, number | null] {
  const m = /^(\d{2}):(\d{2})$/.exec(hm)
  if (!m) return [null, null]
  const h = Number(m[1])
  const mm = Number(m[2])
  if (!Number.isFinite(h) || !Number.isFinite(mm)) return [null, null]
  if (h < 0 || h > 23 || mm < 0 || mm > 59) return [null, null]
  return [h, mm]
}

