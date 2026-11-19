import { useState, type FormEvent } from 'react';
import { Check, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import type { CalendarEventItem } from '../types/dashboard';
import { cn } from '../utils/cn';
import { formatIsoDate, pad2 } from '../utils/dateTime';
import type { WidgetRenderProps } from './types';

const WEEKDAY_HEADERS = ['日', '一', '二', '三', '四', '五', '六'];

export function CalendarWidget({ widget, now, onUpdateConfig }: WidgetRenderProps) {
  const todayIso = formatIsoDate(now);
  const [viewYear, setViewYear] = useState(() => now.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('09:00');

  const events: CalendarEventItem[] = Array.isArray(widget.config.calendarEvents)
    ? widget.config.calendarEvents
    : [];

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstDayOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: Array<{ day: number | null; iso: string }> = [];
  for (let i = 0; i < startWeekday; i += 1) {
    cells.push({ day: null, iso: `empty-start-${i}` });
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    const iso = `${viewYear}-${pad2(viewMonth + 1)}-${pad2(d)}`;
    cells.push({ day: d, iso });
  }

  const eventDates = new Set(events.map((e) => e.date));
  const selectedEvents = events
    .filter((e) => e.date === selectedDate)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleAddEvent = (e: FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    const item: CalendarEventItem = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: selectedDate,
      time: newTime || undefined,
      title,
      completed: false,
    };
    onUpdateConfig({ calendarEvents: [...events, item] });
    setNewTitle('');
  };

  const toggleEvent = (id: string) => {
    onUpdateConfig({
      calendarEvents: events.map((ev) =>
        ev.id === id ? { ...ev, completed: !ev.completed } : ev
      ),
    });
  };

  const deleteEvent = (id: string) => {
    onUpdateConfig({
      calendarEvents: events.filter((ev) => ev.id !== id),
    });
  };

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-4 md:grid-cols-2">
      {/* Left: Monthly Calendar */}
      <div className="flex flex-col justify-between">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono-tabular text-sm font-semibold text-[#F3EBDD]">
            {viewYear} 年 {pad2(viewMonth + 1)} 月
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setViewYear(now.getFullYear());
                setViewMonth(now.getMonth());
                setSelectedDate(todayIso);
              }}
              className="rounded border border-[#C49A52]/25 px-2 py-0.5 text-[11px] text-[#D6BE91] hover:border-[#C49A52] cursor-pointer"
            >
              今天
            </button>
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="上個月"
              className="rounded border border-[#343840] p-1 text-[#D6BE91] hover:border-[#C49A52] cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="下個月"
              className="rounded border border-[#343840] p-1 text-[#D6BE91] hover:border-[#C49A52] cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-[#948D80]">
          {WEEKDAY_HEADERS.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        <div className="grid flex-1 grid-cols-7 gap-1">
          {cells.map((cell) => {
            if (cell.day === null) {
              return <div key={cell.iso} />;
            }
            const isToday = cell.iso === todayIso;
            const isSelected = cell.iso === selectedDate;
            const hasEvent = eventDates.has(cell.iso);

            return (
              <button
                key={cell.iso}
                type="button"
                onClick={() => setSelectedDate(cell.iso)}
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-sm py-1 font-mono-tabular text-xs transition-colors cursor-pointer',
                  isSelected
                    ? 'bg-[#C49A52] font-bold text-[#0B0C0E]'
                    : isToday
                    ? 'border border-[#C49A52]/65 text-[#F3EBDD] font-semibold'
                    : 'text-[#D6BE91] hover:bg-[#1E2127]'
                )}
              >
                <span>{cell.day}</span>
                {hasEvent && (
                  <span
                    className={cn(
                      'mt-0.5 h-1 w-1 rounded-full',
                      isSelected ? 'bg-[#0B0C0E]' : 'bg-[#C97B42]'
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Selected Date Schedule */}
      <div className="flex min-h-0 flex-col border-t border-[#C49A52]/15 pt-3 md:border-l md:border-t-0 md:pl-4 md:pt-0">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-mono-tabular font-semibold text-[#D6BE91]">{selectedDate}</span>
          <span className="text-[#948D80]">共 {selectedEvents.length} 項行程</span>
        </div>

        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
          {selectedEvents.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#948D80]">
              當日尚無安排行程，可於下方新增。
            </div>
          ) : (
            selectedEvents.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between gap-2 rounded border border-[#C49A52]/15 bg-[#101216] px-2.5 py-1.5 text-xs"
              >
                <button
                  type="button"
                  onClick={() => toggleEvent(ev.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left cursor-pointer"
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
                      ev.completed
                        ? 'border-[#C49A52] bg-[#C49A52] text-[#0B0C0E]'
                        : 'border-[#5C616B]'
                    )}
                  >
                    {ev.completed && <Check className="h-3 w-3" />}
                  </span>
                  {ev.time && (
                    <span className="font-mono-tabular text-[11px] text-[#C49A52] shrink-0">
                      {ev.time}
                    </span>
                  )}
                  <span
                    className={cn(
                      'truncate',
                      ev.completed ? 'text-[#706B60] line-through' : 'text-[#F3EBDD]'
                    )}
                  >
                    {ev.title}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => deleteEvent(ev.id)}
                  aria-label={`刪除行程 ${ev.title}`}
                  className="p-1 text-[#706B60] hover:text-[#E05A47] cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleAddEvent} className="mt-2 flex items-center gap-1.5">
          <input
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            aria-label="行程時間"
            className="h-8 w-22 rounded border border-[#C49A52]/25 bg-[#0E1014] px-1.5 font-mono-tabular text-[11px] text-[#D6BE91] focus:border-[#C49A52] focus:outline-none"
          />
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="新增行程內容…"
            aria-label="新行程名稱"
            className="h-8 min-w-0 flex-1 rounded border border-[#C49A52]/25 bg-[#0E1014] px-2.5 text-xs text-[#F3EBDD] placeholder:text-[#706B60] focus:border-[#C49A52] focus:outline-none"
          />
          <button
            type="submit"
            aria-label="新增行程"
            className="inline-flex h-8 items-center gap-1 rounded border border-[#C49A52]/40 bg-[#C49A52]/15 px-2.5 text-xs font-medium text-[#F3EBDD] hover:bg-[#C49A52]/25 shrink-0 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
