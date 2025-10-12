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
  syncedToGoogle?: boolean;
  syncedEvents?: SyncedEvent[];
  syncErrors?: string;
  message: string;
}

export const plannerService = {
  /**
   * Get existing daily plan for a specific date
   */
  async getExistingDailyPlan(date: string): Promise<{ success: boolean; plan: any }> {
    try {
      const response = await api.get(`/planner/daily/${date}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch daily plan');
    }
  },

  /**
   * Get all plans for a date range
   */
  async getPlansInRange(startDate: string, endDate: string): Promise<{ success: boolean; plans: any[] }> {
    try {
      const response = await api.get('/planner/plans/range', {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch plans');
    }
  },

  /**
   * Generate and optionally sync daily plan to calendars
   */
  async generateDailyPlan(date?: string, syncToOutlook = false, syncToGoogle = false): Promise<PlanResponse> {
    try {
      // Get timezone offset in minutes (e.g., -600 for Sydney AEST = UTC+10)
      const timezoneOffset = new Date().getTimezoneOffset();

      const response = await api.post('/planner/daily/generate-and-sync', {
        date,
        syncToOutlook,
        syncToGoogle,
        timezoneOffset
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to generate daily plan');
    }
  },

  /**
   * Generate and optionally sync weekly plan to calendars
   */
  async generateWeeklyPlan(weekStart?: string, syncToOutlook = false, syncToGoogle = false): Promise<PlanResponse> {
    try {
      // Get timezone offset in minutes (e.g., -600 for Sydney AEST = UTC+10)
      const timezoneOffset = new Date().getTimezoneOffset();

      const response = await api.post('/planner/weekly/generate-and-sync', {
        weekStart,
        syncToOutlook,
        syncToGoogle,
        timezoneOffset
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to generate weekly plan');
    }
  }
};

export default plannerService;
