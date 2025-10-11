// Common types used across the application

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  preferences?: any;
}

export interface Task {
  _id?: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'on-hold';
  category: string;
  dueDate?: Date | string;
  tags?: string[];
  aiGenerated?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
