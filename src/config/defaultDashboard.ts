import type { DashboardConfigV1, UserSettings, WidgetInstance } from '../types/dashboard';

export const DEFAULT_USER_SETTINGS: UserSettings = {
  location: '高雄市',
  watchlist: ['2330', '2317', '2454', '0050', '2881'],
  refreshIntervalSec: 300,
  enableGearAnimations: true,
  compactDensity: false,
};

function getFutureDateIso(daysAhead: number, time = '09:00'): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${time}`;
}

function getDateOnly(daysAhead = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function createDefaultWidgets(): WidgetInstance[] {
  const today = getDateOnly(0);
  const tomorrow = getDateOnly(1);
  const nextWeek = getDateOnly(5);

  return [
    {
      id: 'w-analog-clock',
      type: 'analog-clock',
      layout: { x: 0, y: 0, w: 3, h: 6 },
      hidden: false,
      config: {
        title: '維多利亞機械鐘',
        numeralStyle: 'roman',
        showSeconds: true,
        timezone: '',
      },
    },
    {
      id: 'w-digital-clock',
      type: 'digital-clock',
      layout: { x: 3, y: 0, w: 3, h: 3 },
      hidden: false,
      config: {
        title: '標準天文數位鐘',
        use24Hour: true,
        showSeconds: true,
        timezone: '',
      },
    },
    {
      id: 'w-sunset-countdown',
      type: 'sunset-countdown',
      layout: { x: 3, y: 3, w: 3, h: 3 },
      hidden: false,
      config: {
        title: '日落天文倒數',
        locationOverride: '',
      },
    },
    {
      id: 'w-current-weather',
      type: 'current-weather',
      layout: { x: 6, y: 0, w: 3, h: 6 },
      hidden: false,
      config: {
        title: '中央氣象署觀測',
        locationOverride: '',
        temperatureUnit: 'C',
      },
    },
    {
      id: 'w-tomorrow-forecast',
      type: 'tomorrow-forecast',
      layout: { x: 9, y: 0, w: 3, h: 6 },
      hidden: false,
      config: {
        title: '明日氣象預報',
        locationOverride: '',
        temperatureUnit: 'C',
      },
    },
    {
      id: 'w-stock-quote',
      type: 'stock-quote',
      layout: { x: 0, y: 6, w: 4, h: 5 },
      hidden: false,
      config: {
        title: '臺灣證交所收盤報價',
        symbol: '2330',
        showWatchlist: true,
      },
    },
    {
      id: 'w-stock-chart',
      type: 'stock-chart',
      layout: { x: 4, y: 6, w: 5, h: 5 },
      hidden: false,
      config: {
        title: '台股走勢圖',
        symbol: '2330',
        chartDays: 30,
      },
    },
    {
      id: 'w-countdown',
      type: 'countdown',
      layout: { x: 9, y: 6, w: 3, h: 5 },
      hidden: false,
      config: {
        title: '重要日期倒數',
        countdownTargets: [
          {
            id: 'cd-default-1',
            title: '跨年紀念倒數',
            targetDate: `${new Date().getFullYear()}-12-31T23:59`,
          },
        ],
      },
    },
    {
      id: 'w-calendar',
      type: 'calendar',
      layout: { x: 0, y: 11, w: 6, h: 5 },
      hidden: false,
      config: {
        title: '曆法與行程管理',
        calendarEvents: [
          {
            id: 'evt-default-1',
            date: today,
            time: '14:00',
            title: '檢視以太控制台儀表版面',
            completed: false,
          },
          {
            id: 'evt-default-2',
            date: tomorrow,
            time: '09:30',
            title: '確認臺股觀察清單',
            completed: false,
          },
          {
            id: 'evt-default-3',
            date: nextWeek,
            time: '16:00',
            title: '同步設定檔至行動裝置',
            completed: false,
          },
        ],
      },
    },
    {
      id: 'w-todo-list',
      type: 'todo-list',
      layout: { x: 6, y: 11, w: 6, h: 5 },
      hidden: false,
      config: {
        title: '控制台待辦事項',
        todoItems: [
          {
            id: 'todo-default-1',
            text: '於 GitHub Repository Secrets 設定 CWA_API_KEY',
            completed: false,
            priority: 'high',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'todo-default-2',
            text: '設定常用臺灣上市股票觀察清單',
            completed: false,
            priority: 'normal',
            createdAt: new Date().toISOString(),
          },
        ],
      },
    },
  ];
}

export function createDefaultDashboardConfig(): DashboardConfigV1 {
  return {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    widgets: createDefaultWidgets(),
    settings: { ...DEFAULT_USER_SETTINGS },
  };
}
