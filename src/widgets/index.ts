import type { ComponentType } from 'react';
import type { WidgetType } from '../types/dashboard';
import { AnalogClockWidget } from './AnalogClockWidget';
import { CalendarWidget } from './CalendarWidget';
import { CountdownWidget } from './CountdownWidget';
import { CurrentWeatherWidget } from './CurrentWeatherWidget';
import { DigitalClockWidget } from './DigitalClockWidget';
import { StockChartWidget } from './StockChartWidget';
import { StockQuoteWidget } from './StockQuoteWidget';
import { SunsetCountdownWidget } from './SunsetCountdownWidget';
import { TodoListWidget } from './TodoListWidget';
import { TomorrowForecastWidget } from './TomorrowForecastWidget';
import type { WidgetRenderProps } from './types';

export const WIDGET_COMPONENTS: Record<WidgetType, ComponentType<WidgetRenderProps>> = {
  'digital-clock': DigitalClockWidget,
  'analog-clock': AnalogClockWidget,
  'current-weather': CurrentWeatherWidget,
  'tomorrow-forecast': TomorrowForecastWidget,
  'sunset-countdown': SunsetCountdownWidget,
  'stock-quote': StockQuoteWidget,
  'stock-chart': StockChartWidget,
  calendar: CalendarWidget,
  countdown: CountdownWidget,
  'todo-list': TodoListWidget,
};
