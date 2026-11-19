import { useState, type FormEvent } from 'react';
import { CalendarClock, Plus, Trash2 } from 'lucide-react';
import type { CountdownTarget } from '../types/dashboard';
import { getCountdownBreakdown, pad2 } from '../utils/dateTime';
import type { WidgetRenderProps } from './types';

export function CountdownWidget({ widget, now, onUpdateConfig }: WidgetRenderProps) {
  const targets: CountdownTarget[] = Array.isArray(widget.config.countdownTargets)
    ? widget.config.countdownTargets
    : [];

  const [showAddForm, setShowAddForm] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [dateInput, setDateInput] = useState('');

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim() || !dateInput) return;
    const next: CountdownTarget = {
      id: `cd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: titleInput.trim(),
      targetDate: dateInput,
    };
    onUpdateConfig({ countdownTargets: [...targets, next] });
    setTitleInput('');
    setDateInput('');
    setShowAddForm(false);
  };

  const handleRemove = (id: string) => {
    onUpdateConfig({ countdownTargets: targets.filter((t) => t.id !== id) });
  };

  return (
    <div className="flex h-full flex-col justify-between gap-2.5">
      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
        {targets.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-4 text-center text-xs text-[#948D80]">
            <CalendarClock className="h-6 w-6 text-[#8A6A33]" />
            <span>尚未設定倒數目標日期</span>
          </div>
        ) : (
          targets.map((target) => {
            const bd = getCountdownBreakdown(target.targetDate, now);
            return (
              <div
                key={target.id}
                className="rounded border border-[#C49A52]/20 bg-[#101216] p-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-[#F3EBDD]">
                      {target.title}
                    </div>
                    <div className="font-mono-tabular text-[11px] text-[#948D80]">
                      {target.targetDate.replace('T', ' ')} · {bd.isPast ? '已逾期' : '剩餘'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(target.id)}
                    aria-label={`移除倒數 ${target.title}`}
                    className="p-0.5 text-[#706B60] hover:text-[#E05A47] cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-2 flex items-baseline gap-2 font-mono-tabular">
                  <span className="text-xl font-bold text-[#C49A52]">{bd.days}</span>
                  <span className="text-[11px] text-[#948D80]">天</span>
                  <span className="text-base font-semibold text-[#F3EBDD]">
                    {pad2(bd.hours)}:{pad2(bd.minutes)}:{pad2(bd.seconds)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showAddForm ? (
        <form onSubmit={handleAdd} className="space-y-1.5 border-t border-[#C49A52]/15 pt-2">
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder="事件名稱（如：年度計畫）"
            className="h-8 w-full rounded border border-[#C49A52]/30 bg-[#0E1014] px-2.5 text-xs text-[#F3EBDD] placeholder:text-[#706B60] focus:border-[#C49A52] focus:outline-none"
          />
          <div className="flex items-center gap-1.5">
            <input
              type="datetime-local"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="h-8 min-w-0 flex-1 rounded border border-[#C49A52]/30 bg-[#0E1014] px-2 font-mono-tabular text-[11px] text-[#F3EBDD] focus:border-[#C49A52] focus:outline-none"
            />
            <button
              type="submit"
              className="h-8 rounded border border-[#C49A52] bg-[#C49A52]/20 px-2.5 text-xs font-medium text-[#F3EBDD] cursor-pointer shrink-0"
            >
              加入
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="h-8 rounded border border-[#343840] px-2 text-xs text-[#948D80] hover:text-[#F3EBDD] cursor-pointer shrink-0"
            >
              取消
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between border-t border-[#C49A52]/15 pt-2">
          <span className="text-[11px] text-[#948D80]">共 {targets.length} 組計時</span>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#D6BE91] hover:text-[#F3EBDD] cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-[#C49A52]" />
            新增倒數
          </button>
        </div>
      )}
    </div>
  );
}
