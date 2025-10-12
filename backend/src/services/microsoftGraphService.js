const axios = require('axios');

class MicrosoftGraphService {
  constructor() {
    this.clientId = process.env.OUTLOOK_CLIENT_ID;
    this.clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
    this.redirectUri = process.env.OUTLOOK_REDIRECT_URI;
    this.graphApiUrl = 'https://graph.microsoft.com/v1.0';
    this.tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(code) {
    try {
      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
        scope: 'Calendars.ReadWrite User.Read offline_access'
      });

      const response = await axios.post(this.tokenUrl, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      console.error('Error getting access token:', error.response?.data || error.message);
      throw new Error('Failed to exchange code for access token');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken) {
    try {
      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: 'Calendars.ReadWrite User.Read offline_access'
      });

      const response = await axios.post(this.tokenUrl, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      console.error('Error refreshing access token:', error.response?.data || error.message);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Get user profile from Microsoft Graph
   */
  async getUserProfile(accessToken) {
    try {
      const response = await axios.get(`${this.graphApiUrl}/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      return {
        id: response.data.id,
        email: response.data.userPrincipalName || response.data.mail,
        name: response.data.displayName
      };
    } catch (error) {
      console.error('Error getting user profile:', error.response?.data || error.message);
      throw new Error('Failed to get user profile');
    }
  }

  /**
   * Create event in Outlook calendar
   */
  async createEvent(accessToken, event) {
    try {
      const eventData = {
        subject: event.title,
        body: {
          contentType: 'HTML',
          content: event.description || ''
        },
        start: {
          dateTime: new Date(event.startTime).toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: new Date(event.endTime).toISOString(),
          timeZone: 'UTC'
        },
        location: event.location ? {
          displayName: event.location
        } : undefined,
        attendees: event.attendees?.map(email => ({
          emailAddress: { address: email },
          type: 'required'
        })) || []
      };

      const response = await axios.post(
        `${this.graphApiUrl}/me/calendar/events`,
        eventData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        id: response.data.id,
        webLink: response.data.webLink
      };
    } catch (error) {
      console.error('Error creating event:', error.response?.data || error.message);
      throw new Error('Failed to create calendar event');
    }
  }

  /**
   * Get calendar events
   */
  async getEvents(accessToken, startDate, endDate) {
    try {
      const params = new URLSearchParams({
        $filter: `start/dateTime ge '${startDate.toISOString()}' and end/dateTime le '${endDate.toISOString()}'`,
        $select: 'subject,start,end,location,body,attendees,webLink',
        $orderby: 'start/dateTime',
        $top: 50
      });

      const response = await axios.get(
        `${this.graphApiUrl}/me/calendar/events?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      return response.data.value.map(event => ({
        id: event.id,
        title: event.subject,
        description: event.body?.content || '',
        startTime: event.start.dateTime,
        endTime: event.end.dateTime,
        location: event.location?.displayName || '',
        attendees: event.attendees?.map(a => a.emailAddress.address) || [],
        webLink: event.webLink
      }));
    } catch (error) {
      console.error('Error getting events:', error.response?.data || error.message);
      throw new Error('Failed to get calendar events');
    }
  }

  /**
   * Update calendar event
   */
  async updateEvent(accessToken, eventId, updates) {
    try {
      const eventData = {
        subject: updates.title,
        body: updates.description ? {
          contentType: 'HTML',
          content: updates.description
        } : undefined,
        start: updates.startTime ? {
          dateTime: new Date(updates.startTime).toISOString(),
          timeZone: 'UTC'
        } : undefined,
        end: updates.endTime ? {
          dateTime: new Date(updates.endTime).toISOString(),
          timeZone: 'UTC'
        } : undefined
      };

      await axios.patch(
        `${this.graphApiUrl}/me/calendar/events/${eventId}`,
        eventData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Error updating event:', error.response?.data || error.message);
      throw new Error('Failed to update calendar event');
    }
  }

  /**
   * Delete calendar event
   */
  async deleteEvent(accessToken, eventId) {
    try {
      await axios.delete(
        `${this.graphApiUrl}/me/calendar/events/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Error deleting event:', error.response?.data || error.message);
      throw new Error('Failed to delete calendar event');
    }
  }
}

module.exports = new MicrosoftGraphService();
