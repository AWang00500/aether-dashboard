import type {
  WidgetCategory,
  WidgetConfig,
  WidgetType,
} from '../types/dashboard';

export interface WidgetCatalogEntry {
  type: WidgetType;
  category: WidgetCategory;
  categoryLabel: string;
  name: string;
  englishName: string;
  description: string;
  defaultSize: { w: number; h: number };
  minSize: { minW: number; minH: number };
  maxSize: { maxW: number; maxH: number };
  createDefaultConfig: () => WidgetConfig;
}

export const WIDGET_CATEGORY_LABELS: Record<WidgetCategory, string> = {
  time: '時間類',
  weather: '天氣類',
  finance: '金融類',
  personal: '個人管理類',
};

export const WIDGET_CATALOG: Record<WidgetType, WidgetCatalogEntry> = {
  'digital-clock': {
    type: 'digital-clock',
    category: 'time',
    categoryLabel: '時間類',
    name: '數位時鐘',
    englishName: 'Digital Clock',
    description: '高精度瀏覽器本地時間顯示，支援秒數、24/12 小時制與自訂時區。',
    defaultSize: { w: 3, h: 3 },
    minSize: { minW: 2, minH: 2 },
    maxSize: { maxW: 12, maxH: 8 },
    createDefaultConfig: () => ({
      title: '標準天文數位鐘',
      use24Hour: true,
      showSeconds: true,
      timezone: '',
    }),
  },
  'analog-clock': {
    type: 'analog-clock',
    category: 'time',
    categoryLabel: '時間類',
    name: '機械時鐘',
    englishName: 'Analog Clock',
    description: '維多利亞黃銅機械指針錶盤，具羅馬或阿拉伯數字刻度與可視齒輪機構。',
    defaultSize: { w: 3, h: 6 },
    minSize: { minW: 2, minH: 4 },
    maxSize: { maxW: 8, maxH: 10 },
    createDefaultConfig: () => ({
      title: '維多利亞機械鐘',
      numeralStyle: 'roman',
      showSeconds: true,
      timezone: '',
    }),
  },
  'current-weather': {
    type: 'current-weather',
    category: 'weather',
    categoryLabel: '天氣類',
    name: '今日天氣',
    englishName: 'Current Weather',
    description: '顯示所在地氣溫、高低溫區間、降雨機率、濕度與日出日落時刻。',
    defaultSize: { w: 3, h: 6 },
    minSize: { minW: 3, minH: 4 },
    maxSize: { maxW: 8, maxH: 9 },
    createDefaultConfig: () => ({
      title: '大氣觀測儀',
      locationOverride: '',
      temperatureUnit: 'C',
    }),
  },
  'tomorrow-forecast': {
    type: 'tomorrow-forecast',
    category: 'weather',
    categoryLabel: '天氣類',
    name: '明日天氣',
    englishName: 'Tomorrow Forecast',
    description: '中央氣象署明日天氣概況、氣溫區間、降雨機率與舒適度評估。',
    defaultSize: { w: 3, h: 6 },
    minSize: { minW: 2, minH: 4 },
    maxSize: { maxW: 8, maxH: 9 },
    createDefaultConfig: () => ({
      title: '明日氣象預報',
      locationOverride: '',
      temperatureUnit: 'C',
    }),
  },
  'sunset-countdown': {
    type: 'sunset-countdown',
    category: 'weather',
    categoryLabel: '天氣類',
    name: '日落／日出倒數',
    englishName: 'Sunset Countdown',
    description: '依中央氣象署逐日日出日沒時刻，白天倒數今日日落、日落後自動切換倒數隔日日出。',
    defaultSize: { w: 3, h: 3 },
    minSize: { minW: 2, minH: 3 },
    maxSize: { maxW: 8, maxH: 7 },
    createDefaultConfig: () => ({
      title: '日落天文倒數',
      locationOverride: '',
    }),
  },
  'stock-quote': {
    type: 'stock-quote',
    category: 'finance',
    categoryLabel: '金融類',
    name: '股票報價',
    englishName: 'Stock Quote',
    description: '臺灣證券交易所上市個股每日收盤報價與觀察清單快速切換。',
    defaultSize: { w: 4, h: 5 },
    minSize: { minW: 3, minH: 4 },
    maxSize: { maxW: 12, maxH: 10 },
    createDefaultConfig: () => ({
      title: '臺灣證交所收盤報價',
      symbol: '2330',
      showWatchlist: true,
    }),
  },
  'stock-chart': {
    type: 'stock-chart',
    category: 'finance',
    categoryLabel: '金融類',
    name: '股票走勢圖',
    englishName: 'Stock Chart',
    description: '使用 Chart.js 繪製臺灣證券交易所上市個股歷史收盤價格走勢。',
    defaultSize: { w: 5, h: 5 },
    minSize: { minW: 3, minH: 4 },
    maxSize: { maxW: 12, maxH: 10 },
    createDefaultConfig: () => ({
      title: '台股走勢圖',
      symbol: '2330',
      chartDays: 30,
    }),
  },
  calendar: {
    type: 'calendar',
    category: 'personal',
    categoryLabel: '個人管理類',
    name: '日期及行程',
    englishName: 'Calendar',
    description: '整合月曆檢視與個人行程排程，支援新增、標記完成與刪除行程。',
    defaultSize: { w: 6, h: 5 },
    minSize: { minW: 3, minH: 4 },
    maxSize: { maxW: 12, maxH: 10 },
    createDefaultConfig: () => {
      const today = new Date();
      const isoToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      return {
        title: '曆法與行程表',
        calendarEvents: [
          {
            id: `evt-${Date.now()}-1`,
            date: isoToday,
            time: '10:00',
            title: '校正控制台儀表配置',
            completed: false,
          },
        ],
      };
    },
  },
  countdown: {
    type: 'countdown',
    category: 'personal',
    categoryLabel: '個人管理類',
    name: '重要日期倒數',
    englishName: 'Countdown',
    description: '追蹤重要節日、專案截止或紀念日倒數，顯示天數與時分秒。',
    defaultSize: { w: 3, h: 5 },
    minSize: { minW: 2, minH: 3 },
    maxSize: { maxW: 8, maxH: 9 },
    createDefaultConfig: () => {
      const future = new Date();
      future.setDate(future.getDate() + 14);
      const iso = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}T18:00`;
      return {
        title: '重要里程碑倒數',
        countdownTargets: [
          {
            id: `cd-${Date.now()}-1`,
            title: '下一階段引擎檢修',
            targetDate: iso,
          },
        ],
      };
    },
  },
  'todo-list': {
    type: 'todo-list',
    category: 'personal',
    categoryLabel: '個人管理類',
    name: '待辦事項',
    englishName: 'To-do List',
    description: '即時新增、勾選完成、標記優先級與清理個人日常待辦任務。',
    defaultSize: { w: 6, h: 5 },
    minSize: { minW: 3, minH: 3 },
    maxSize: { maxW: 12, maxH: 10 },
    createDefaultConfig: () => ({
      title: '作業待辦清單',
      todoItems: [
        {
          id: `todo-${Date.now()}-1`,
          text: '檢視台股觀察清單收盤紀錄',
          completed: false,
          priority: 'high',
          createdAt: new Date().toISOString(),
        },
        {
          id: `todo-${Date.now()}-2`,
          text: '設定所在城市與更新頻率',
          completed: false,
          priority: 'normal',
          createdAt: new Date().toISOString(),
        },
      ],
    }),
  },
};

export const WIDGET_CATALOG_LIST: WidgetCatalogEntry[] = Object.values(WIDGET_CATALOG);

export function isValidWidgetType(value: unknown): value is WidgetType {
  return typeof value === 'string' && value in WIDGET_CATALOG;
}
