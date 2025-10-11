import { create } from 'zustand';
import { taskService, Task, TaskFilters } from '../services/taskService';

interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  error: string | null;
  filters: TaskFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null;

  fetchTasks: (filters?: TaskFilters) => Promise<void>;
  fetchTaskById: (id: string) => Promise<void>;
  createTask: (task: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setFilters: (filters: TaskFilters) => void;
  clearError: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  currentTask: null,
  isLoading: false,
  error: null,
  filters: {},
  pagination: null,

  fetchTasks: async (filters?: TaskFilters) => {
    set({ isLoading: true, error: null });
    try {
      const data = await taskService.getTasks(filters || get().filters);
      set({
        tasks: data.tasks,
        pagination: data.pagination,
        isLoading: false
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch tasks',
        isLoading: false
      });
    }
  },

  fetchTaskById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const task = await taskService.getTaskById(id);
      set({
        currentTask: task,
        isLoading: false
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch task',
        isLoading: false
      });
    }
  },

  createTask: async (taskData: Partial<Task>) => {
    set({ isLoading: true, error: null });
    try {
      const task = await taskService.createTask(taskData);
      set((state) => ({
        tasks: [task, ...state.tasks],
        isLoading: false
      }));
      return task;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create task',
        isLoading: false
      });
      throw error;
    }
  },

  updateTask: async (id: string, taskData: Partial<Task>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedTask = await taskService.updateTask(id, taskData);
      set((state) => ({
        tasks: state.tasks.map(task => task._id === id ? updatedTask : task),
        currentTask: state.currentTask?._id === id ? updatedTask : state.currentTask,
        isLoading: false
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update task',
        isLoading: false
      });
      throw error;
    }
  },

  deleteTask: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await taskService.deleteTask(id);
      set((state) => ({
        tasks: state.tasks.filter(task => task._id !== id),
        isLoading: false
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete task',
        isLoading: false
      });
      throw error;
    }
  },

  setFilters: (filters: TaskFilters) => {
    set({ filters });
    get().fetchTasks(filters);
  },

  clearError: () => set({ error: null })
}));
