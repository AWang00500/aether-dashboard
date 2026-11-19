export type DataSourceMode = 'api' | 'snapshot' | 'unconfigured' | 'error';

export type WeatherConditionCode =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'rain'
  | 'thunderstorm'
  | 'fog';

export interface WeatherForecastDay {
  date: string;
  label: string;
  condition: string;
  conditionCode: WeatherConditionCode;
  tempMinC: number | null;
  tempMaxC: number | null;
  popPercent: number | null;
  comfortIndex: string | null;
}

export interface WeatherObservation {
  location: string;
  stationName?: string | null;
  currentTempC: number | null;
  tempMinC: number | null;
  tempMaxC: number | null;
  condition: string;
  conditionCode: WeatherConditionCode;
  popPercent: number | null;
  humidityPercent: number | null;
  pressureHpa: number | null;
  windSpeedMs: number | null;
  yesterdaySunsetTime?: string | null;
  yesterdaySunsetIso?: string | null;
  sunriseTime: string | null;
  sunsetTime: string | null;
  sunriseIso: string | null;
  sunsetIso: string | null;
  tomorrowSunriseTime?: string | null;
  tomorrowSunriseIso?: string | null;
  tomorrowSunsetTime?: string | null;
  tomorrowSunsetIso?: string | null;
  tomorrow: WeatherForecastDay | null;
  sourceMode: DataSourceMode;
  sourceLabel: string;
  isRealtime: boolean;
  observedAt: string;
  errorMessage?: string;
}
