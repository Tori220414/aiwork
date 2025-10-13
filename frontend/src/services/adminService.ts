import axiosInstance from './axios';

export interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalTasks: number;
  openTickets: number;
  newUsersThisMonth: number;
  revenueThisMonth: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  is_active: boolean;
  is_admin: boolean;
  is_superadmin: boolean;
  admin_permissions: string[];
}

export interface Subscription {
  id: string;
  user_id: string;
  status: string;
  plan_id: string;
  amount: number;
  stripe_subscription_id?: string;
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  canceled_at?: string;
  created_at: string;
  users: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
  status: string;
  assigned_to?: string;
  admin_notes?: string;
  responses: Array<{
    admin_id: string;
    message: string;
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  users: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AdminActivity {
  id: string;
  admin_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  users: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SystemSetting {
  id: string;
  key: string;
  value: any;
  category: string;
  description?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export const adminService = {
  /**
   * Get admin dashboard statistics
   */
  async getStats(): Promise<AdminStats> {
    const response = await axiosInstance.get('/admin/stats');
    return response.data.data;
  },

  /**
   * Get paginated list of users with optional filters
   */
  async getUsers(page = 1, limit = 50, search = '', status = '') {
    const response = await axiosInstance.get('/admin/users', {
      params: { page, limit, search, status }
    });
    return response.data.data;
  },

  /**
   * Update user active status
   */
  async updateUserStatus(userId: string, isActive: boolean) {
    const response = await axiosInstance.put(`/admin/users/${userId}/status`, {
      is_active: isActive
    });
    return response.data;
  },

  /**
   * Grant or revoke admin privileges
   */
  async updateUserAdmin(userId: string, isAdmin: boolean, permissions: string[] = []) {
    const response = await axiosInstance.put(`/admin/users/${userId}/admin`, {
      is_admin: isAdmin,
      admin_permissions: permissions
    });
    return response.data;
  },

  /**
   * Get paginated list of subscriptions
   */
  async getSubscriptions(page = 1, limit = 50, status = '') {
    const response = await axiosInstance.get('/admin/subscriptions', {
      params: { page, limit, status }
    });
    return response.data.data;
  },

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string) {
    const response = await axiosInstance.put(`/admin/subscriptions/${subscriptionId}/cancel`);
    return response.data;
  },

  /**
   * Get paginated list of support tickets
   */
  async getSupportTickets(page = 1, limit = 50, status = '', priority = '') {
    const response = await axiosInstance.get('/admin/support-tickets', {
      params: { page, limit, status, priority }
    });
    return response.data.data;
  },

  /**
   * Update support ticket
   */
  async updateSupportTicket(ticketId: string, updates: {
    status?: string;
    priority?: string;
    assigned_to?: string;
    admin_notes?: string;
    response?: string;
  }) {
    const response = await axiosInstance.put(`/admin/support-tickets/${ticketId}`, updates);
    return response.data;
  },

  /**
   * Get admin activity log
   */
  async getActivityLog(page = 1, limit = 100, adminId = '') {
    const response = await axiosInstance.get('/admin/activity-log', {
      params: { page, limit, adminId }
    });
    return response.data.data;
  },

  /**
   * Get all system settings
   */
  async getSettings() {
    const response = await axiosInstance.get('/admin/settings');
    return response.data.data;
  },

  /**
   * Update a system setting
   */
  async updateSetting(settingId: string, value: any) {
    const response = await axiosInstance.put(`/admin/settings/${settingId}`, { value });
    return response.data;
  }
};
