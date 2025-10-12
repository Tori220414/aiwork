import api from './api';

export interface Task {
  _id?: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'on-hold';
  category: 'work' | 'personal' | 'meeting' | 'email' | 'planning' | 'learning' | 'health' | 'other';
  dueDate?: Date | string;
  startDate?: Date | string;
  estimatedTime?: number;
  actualTime?: number;
  priorityScore?: number;
  tags?: string[];
  project?: string;
  dependencies?: string[];
  subtasks?: Array<{
    title: string;
    completed: boolean;
    completedAt?: Date;
  }>;
  recurrence?: {
    type: 'daily' | 'weekly' | 'monthly' | 'custom';
    interval: number;
    daysOfWeek?: number[];
    endsOn?: Date | string;
  };
  scheduleType?: 'daily' | 'weekly' | 'monthly' | 'once';
  aiGenerated?: boolean;
  aiInsights?: {
    priorityReason?: string;
    suggestedTime?: string;
    matrix?: string;
    recommendations?: string[];
  };
  completedAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  category?: string;
  project?: string;
  search?: string;
  sortBy?: string;
  limit?: number;
  page?: number;
}

export interface TasksResponse {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const taskService = {
  async getTasks(filters?: TaskFilters): Promise<TasksResponse> {
    const response = await api.get<TasksResponse>('/tasks', { params: filters });
    return response.data;
  },

  async getTaskById(id: string): Promise<Task> {
    const response = await api.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  async createTask(taskData: Partial<Task>): Promise<Task> {
    const response = await api.post<Task>('/tasks', taskData);
    return response.data;
  },

  async updateTask(id: string, taskData: Partial<Task>): Promise<Task> {
    const response = await api.put<Task>(`/tasks/${id}`, taskData);
    return response.data;
  },

  async deleteTask(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },

  async addSubtask(taskId: string, subtask: { title: string }): Promise<Task> {
    const response = await api.post<Task>(`/tasks/${taskId}/subtask`, subtask);
    return response.data;
  }
};

export default taskService;
