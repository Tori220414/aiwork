import api from './api';
import { Task } from './taskService';

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
  productivityScore: number;
}

export interface UserStats {
  totalTasksCompleted: number;
  totalTasksCreated: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: Date;
}

export interface Project {
  _id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  status: string;
  progress: number;
  stats: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
  };
}

export interface DashboardData {
  stats: DashboardStats;
  todayTasks: Task[];
  upcomingTasks: Task[];
  projects: Project[];
  userStats: UserStats;
}

export interface AnalyticsData {
  completedTasks: Array<{ _id: string; count: number }>;
  tasksByCategory: Array<{ _id: string; count: number }>;
  tasksByPriority: Array<{ _id: string; count: number }>;
}

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    const response = await api.get<DashboardData>('/dashboard');
    return response.data;
  },

  async getAnalytics(period: '7d' | '30d' | '90d' = '7d'): Promise<AnalyticsData> {
    const response = await api.get<AnalyticsData>(`/dashboard/analytics?period=${period}`);
    return response.data;
  }
};

export default dashboardService;
