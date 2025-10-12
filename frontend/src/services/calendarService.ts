import api from './api';

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startTime: Date | string;
  endTime: Date | string;
  location?: string;
  attendees?: string[];
  taskId?: string;
}

export interface OutlookAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

export const calendarService = {
  /**
   * Get Outlook OAuth URL for authentication
   */
  getOutlookAuthUrl(): string {
    const config: OutlookAuthConfig = {
      clientId: process.env.REACT_APP_OUTLOOK_CLIENT_ID || '',
      redirectUri: `${window.location.origin}/auth/outlook/callback`,
      scopes: ['Calendars.ReadWrite', 'User.Read', 'offline_access']
    };

    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: 'code',
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(' '),
      response_mode: 'query',
      prompt: 'select_account'  // Force account selection every time
    });

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  },

  /**
   * Exchange OAuth code for access token
   */
  async connectOutlook(code: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('/calendar/outlook/connect', { code });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to connect Outlook');
    }
  },

  /**
   * Get Outlook calendar connection status
   */
  async getOutlookStatus(): Promise<{ connected: boolean; email?: string }> {
    try {
      const response = await api.get('/calendar/outlook/status');
      return response.data;
    } catch (error) {
      return { connected: false };
    }
  },

  /**
   * Disconnect Outlook calendar
   */
  async disconnectOutlook(): Promise<{ success: boolean }> {
    try {
      const response = await api.post('/calendar/outlook/disconnect');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to disconnect Outlook');
    }
  },

  /**
   * Sync task to Outlook calendar
   */
  async syncTaskToOutlook(taskId: string): Promise<{ success: boolean; eventId?: string }> {
    try {
      const response = await api.post(`/calendar/outlook/sync-task/${taskId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to sync task to Outlook');
    }
  },

  /**
   * Create event in Outlook calendar
   */
  async createOutlookEvent(event: CalendarEvent): Promise<{ success: boolean; eventId: string }> {
    try {
      const response = await api.post('/calendar/outlook/events', event);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create Outlook event');
    }
  },

  /**
   * Get upcoming Outlook events
   */
  async getOutlookEvents(startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate.toISOString();
      if (endDate) params.endDate = endDate.toISOString();

      const response = await api.get('/calendar/outlook/events', { params });
      return response.data.events || [];
    } catch (error) {
      console.error('Failed to fetch Outlook events:', error);
      return [];
    }
  },

  /**
   * Import Outlook events as tasks
   */
  async importOutlookEvents(eventIds: string[]): Promise<{ success: boolean; tasksCreated: number }> {
    try {
      const response = await api.post('/calendar/outlook/import', { eventIds });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to import Outlook events');
    }
  }
};

export default calendarService;
