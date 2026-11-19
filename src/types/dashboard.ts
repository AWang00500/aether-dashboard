export type WidgetCategory = 'time' | 'weather' | 'finance' | 'personal';

export type WidgetType =
  | 'digital-clock'
  | 'analog-clock'
  | 'current-weather'
  | 'tomorrow-forecast'
  | 'sunset-countdown'
  | 'stock-quote'
  | 'stock-chart'
  | 'calendar'
  | 'countdown'
  | 'todo-list';

export type ConsoleMode = 'standby' | 'edit';

export interface GridPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  priority: 'normal' | 'high';
  createdAt: string;
}

export interface CalendarEventItem {
  id: string;
  date: string;
  time?: string;
  title: string;
  completed?: boolean;
}

export interface CountdownTarget {
  id: string;
  title: string;
  targetDate: string;
}

export interface WidgetConfig {
  title?: string;
  use24Hour?: boolean;
  showSeconds?: boolean;
  timezone?: string;
  numeralStyle?: 'roman' | 'arabic';
  locationOverride?: string;
  temperatureUnit?: 'C' | 'F';
  symbol?: string;
  showWatchlist?: boolean;
  chartDays?: 7 | 30 | 90;
  calendarEvents?: CalendarEventItem[];
  countdownTargets?: CountdownTarget[];
  todoItems?: TodoItem[];
  [key: string]: unknown;
}

export interface WidgetInstance {
  id: string;
  type: WidgetType;
  layout: GridPosition;
  hidden: boolean;
  config: WidgetConfig;
  lastUpdated?: string;
}

export type RefreshIntervalSeconds = 0 | 10 | 30 | 60 | 300;

export interface UserSettings {
  location: string;
  watchlist: string[];
  refreshIntervalSec: RefreshIntervalSeconds;
  enableGearAnimations: boolean;
  compactDensity: boolean;
}

export interface DashboardConfigV1 {
  schemaVersion: 1;
  updatedAt: string;
  widgets: WidgetInstance[];
  settings: UserSettings;
}
