import api from './api';
import type { DailyPlan, WeeklyPlan } from './aiService';

export type { DailyPlan, WeeklyPlan };

export interface SyncedEvent {
  taskTitle: string;
  startTime: string;
  endTime: string;
  outlookEventId: string;
  day?: string;
}

export interface PlanResponse {
  success: boolean;
  plan: DailyPlan | WeeklyPlan;
  syncedToOutlook: boolean;
  syncedEvents?: SyncedEvent[];
  syncError?: string;
  message: string;
}

export const plannerService = {
  /**
   * Generate and optionally sync daily plan to Outlook
   */
  async generateDailyPlan(date?: string, syncToOutlook = true): Promise<PlanResponse> {
    try {
      // Get timezone offset in minutes (e.g., -600 for Sydney AEST = UTC+10)
      const timezoneOffset = new Date().getTimezoneOffset();

      const response = await api.post('/planner/daily/generate-and-sync', {
        date,
        syncToOutlook,
        timezoneOffset
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to generate daily plan');
    }
  },

  /**
   * Generate and optionally sync weekly plan to Outlook
   */
  async generateWeeklyPlan(weekStart?: string, syncToOutlook = true): Promise<PlanResponse> {
    try {
      // Get timezone offset in minutes (e.g., -600 for Sydney AEST = UTC+10)
      const timezoneOffset = new Date().getTimezoneOffset();

      const response = await api.post('/planner/weekly/generate-and-sync', {
        weekStart,
        syncToOutlook,
        timezoneOffset
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to generate weekly plan');
    }
  }
};

export default plannerService;
