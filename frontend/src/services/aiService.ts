import api from './api';
import { Task } from './taskService';

export interface DailyPlan {
  summary: string;
  timeBlocks: Array<{
    startTime: string;
    endTime: string;
    taskId?: string;
    taskTitle: string;
    type: 'deep-work' | 'meeting' | 'admin' | 'break' | 'planning';
    notes: string;
  }>;
  tips: string[];
  estimatedProductivity: number;
}

export interface ProductivityAnalysis {
  productivityScore: number;
  strengths: string[];
  improvements: string[];
  patterns: {
    mostProductiveTime: string;
    taskCompletionRate: number;
    averageTaskTime: number;
    commonCategories?: string[];
  };
  recommendations: string[];
  insights?: string;
}

export interface MeetingPrep {
  agenda: string[];
  talkingPoints: string[];
  questions: string[];
  backgroundInfo: string;
  actionItems: string[];
  followUp: string[];
  timeAllocation?: {
    intro: string;
    discussion: string;
    conclusion: string;
  };
}

export interface TaskSuggestion {
  title: string;
  description: string;
  priority: string;
  estimatedTime: number;
  category: string;
  reasoning: string;
}

export const aiService = {
  async extractTasksFromText(text: string): Promise<{ message: string; tasks: Task[] }> {
    const response = await api.post('/ai/extract-tasks', { text });
    return response.data;
  },

  async prioritizeTasks(taskIds: string[]): Promise<{ message: string; tasks: Task[] }> {
    const response = await api.post('/ai/prioritize', { taskIds });
    return response.data;
  },

  async generateDailyPlan(date?: string): Promise<{ date: Date; plan: DailyPlan; tasksIncluded: number }> {
    const response = await api.post('/ai/daily-plan', { date });
    return response.data;
  },

  async getProductivityAnalysis(period: '7d' | '30d' = '7d'): Promise<{
    period: string;
    analysis: ProductivityAnalysis;
    dataPoints: number;
  }> {
    const response = await api.get(`/ai/productivity-analysis?period=${period}`);
    return response.data;
  },

  async generateMeetingPrep(meetingInfo: {
    title: string;
    attendees?: string;
    date?: string;
    duration?: string;
    context?: string;
  }): Promise<{ meeting: any; preparation: MeetingPrep }> {
    const response = await api.post('/ai/meeting-prep', meetingInfo);
    return response.data;
  },

  async suggestTasks(context?: {
    userRole?: string;
    recentActivity?: any[];
  }): Promise<{ suggestions: TaskSuggestion[]; context: any }> {
    const response = await api.post('/ai/suggest-tasks', context || {});
    return response.data;
  }
};

export default aiService;
