import { useState, type FormEvent } from 'react';
import { Check, Flag, Plus, Trash2 } from 'lucide-react';
import type { TodoItem } from '../types/dashboard';
import { cn } from '../utils/cn';
import type { WidgetRenderProps } from './types';

export function TodoListWidget({ widget, onUpdateConfig }: WidgetRenderProps) {
  const items: TodoItem[] = Array.isArray(widget.config.todoItems)
    ? widget.config.todoItems
    : [];

  const [text, setText] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high'>('normal');

  const pendingCount = items.filter((t) => !t.completed).length;
  const completedCount = items.length - pendingCount;

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = text.trim();
    if (!cleaned) return;
    const nextItem: TodoItem = {
      id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: cleaned,
      completed: false,
      priority,
      createdAt: new Date().toISOString(),
    };
    onUpdateConfig({ todoItems: [nextItem, ...items] });
    setText('');
    setPriority('normal');
  };

  const toggleItem = (id: string) => {
    onUpdateConfig({
      todoItems: items.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
    });
  };

  const removeItem = (id: string) => {
    onUpdateConfig({
      todoItems: items.filter((t) => t.id !== id),
    });
  };

  const clearCompleted = () => {
    onUpdateConfig({
      todoItems: items.filter((t) => !t.completed),
    });
  };

  return (
    <div className="flex h-full flex-col justify-between gap-2.5">
      {/* Quick Add Input */}
      <form onSubmit={handleAdd} className="flex items-center gap-1.5">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="新增待辦項目…"
          aria-label="新增待辦事項內容"
          className="h-8 min-w-0 flex-1 rounded border border-[#C49A52]/25 bg-[#0E1014] px-2.5 text-xs text-[#F3EBDD] placeholder:text-[#706B60] focus:border-[#C49A52] focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setPriority((p) => (p === 'normal' ? 'high' : 'normal'))}
          title={priority === 'high' ? '優先級：高' : '優先級：一般'}
          aria-label={priority === 'high' ? '切換為一般優先級' : '切換為高優先級'}
          className={cn(
            'inline-flex h-8 items-center gap-1 rounded border px-2 text-xs transition-colors cursor-pointer shrink-0',
            priority === 'high'
              ? 'border-[#C97B42] bg-[#C97B42]/20 text-[#F3EBDD]'
              : 'border-[#343840] bg-[#16191E] text-[#948D80] hover:text-[#D6BE91]'
          )}
        >
          <Flag className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{priority === 'high' ? '重要' : '一般'}</span>
        </button>
        <button
          type="submit"
          aria-label="加入待辦事項"
          className="inline-flex h-8 items-center gap-1 rounded border border-[#C49A52]/40 bg-[#C49A52]/15 px-2.5 text-xs font-medium text-[#F3EBDD] hover:bg-[#C49A52]/25 shrink-0 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5 text-[#C49A52]" />
          新增
        </button>
      </form>

      {/* Checklist */}
      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <div className="flex h-full items-center justify-center py-4 text-xs text-[#948D80]">
            目前沒有待辦事項，可於上方欄位快速新增。
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 rounded border border-[#C49A52]/15 bg-[#101216] px-2.5 py-2 text-xs"
            >
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                className="flex min-w-0 flex-1 items-center gap-2.5 text-left cursor-pointer"
              >
                <span
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors',
                    item.completed
                      ? 'border-[#C49A52] bg-[#C49A52] text-[#0B0C0E]'
                      : 'border-[#5C616B] bg-[#0B0C0E]'
                  )}
                >
                  {item.completed && <Check className="h-3 w-3" />}
                </span>
                {item.priority === 'high' && !item.completed && (
                  <Flag className="h-3 w-3 shrink-0 text-[#C97B42]" aria-label="重要項目" />
                )}
                <span
                  className={cn(
                    'truncate',
                    item.completed ? 'text-[#706B60] line-through' : 'text-[#F3EBDD]'
                  )}
                >
                  {item.text}
                </span>
              </button>

              <button
                type="button"
                onClick={() => removeItem(item.id)}
                aria-label={`刪除待辦 ${item.text}`}
                className="p-1 text-[#706B60] hover:text-[#E05A47] cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Summary & Cleanup */}
      <div className="flex items-center justify-between border-t border-[#C49A52]/15 pt-2 text-[11px] text-[#948D80]">
        <span className="tabular-nums">
          待完成 {pendingCount} · 已完成 {completedCount}
        </span>
        {completedCount > 0 && (
          <button
            type="button"
            onClick={clearCompleted}
            className="text-[#D6BE91] hover:text-[#F3EBDD] cursor-pointer"
          >
            清除已完成
          </button>
        )}
      </div>
    </div>
  );
}
