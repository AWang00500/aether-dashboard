import type { UserSettings, WidgetConfig, WidgetInstance } from '../types/dashboard';

export interface WidgetRenderProps {
  widget: WidgetInstance;
  now: Date;
  settings: UserSettings;
  refreshTick: number;
  lastRefreshAt: string;
  isEditMode: boolean;
  onUpdateConfig: (partial: Partial<WidgetConfig>) => void;
  onUpdateSettings: (partial: Partial<UserSettings>) => void;
}
