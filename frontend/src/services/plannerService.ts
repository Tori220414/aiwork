import api from './api';

export interface TimeBlock {
  startTime: string;
  endTime: string;
  taskTitle?: string;
  taskId?: string;
  type?: 'task' | 'break';
  notes?: string;
}

export interface DailyPlan {
  date: string;
  timeBlocks: TimeBlock[];
  summary?: string;
  totalTasks?: number;
}

export interface WeeklyPlan {
  weekStart: string;
  weekEnd: string;
  days: {
    date: string;
    dayName: string;
    plan: DailyPlan;
  }[];
}

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
      const response = await api.post('/planner/daily/generate-and-sync', {
        date,
        syncToOutlook
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
      const response = await api.post('/planner/weekly/generate-and-sync', {
        weekStart,
        syncToOutlook
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to generate weekly plan');
    }
  }
};

export default plannerService;
