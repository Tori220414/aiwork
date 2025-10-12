const { google } = require('googleapis');
const axios = require('axios');

class GoogleCalendarService {
  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID;
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    this.redirectUri = process.env.GOOGLE_REDIRECT_URI;
    this.oauth2Client = null;

    if (this.clientId && this.clientSecret) {
      this.oauth2Client = new google.auth.OAuth2(
        this.clientId,
        this.clientSecret,
        this.redirectUri
      );
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(code) {
    try {
      if (!this.oauth2Client) {
        throw new Error('Google OAuth client not initialized. Check environment variables.');
      }

      const { tokens } = await this.oauth2Client.getToken(code);

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600,
        idToken: tokens.id_token
      };
    } catch (error) {
      console.error('Error exchanging Google code for token:', error);
      throw new Error(`Failed to get Google access token: ${error.message}`);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken) {
    try {
      if (!this.oauth2Client) {
        throw new Error('Google OAuth client not initialized.');
      }

      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      return {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token || refreshToken,
        expiresIn: credentials.expiry_date ? Math.floor((credentials.expiry_date - Date.now()) / 1000) : 3600
      };
    } catch (error) {
      console.error('Error refreshing Google access token:', error);
      throw new Error('Failed to refresh Google access token');
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(accessToken) {
    try {
      const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      return {
        id: response.data.id,
        email: response.data.email,
        name: response.data.name,
        picture: response.data.picture
      };
    } catch (error) {
      console.error('Error getting Google user profile:', error);
      throw new Error('Failed to get user profile');
    }
  }

  /**
   * Create calendar event
   */
  async createEvent(accessToken, eventData) {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const event = {
        summary: eventData.title,
        description: eventData.description || '',
        start: {
          dateTime: eventData.startTime instanceof Date
            ? eventData.startTime.toISOString()
            : new Date(eventData.startTime).toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: eventData.endTime instanceof Date
            ? eventData.endTime.toISOString()
            : new Date(eventData.endTime).toISOString(),
          timeZone: 'UTC'
        }
      };

      if (eventData.location) {
        event.location = eventData.location;
      }

      if (eventData.attendees && eventData.attendees.length > 0) {
        event.attendees = eventData.attendees.map(email => ({ email }));
      }

      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });

      return {
        id: response.data.id,
        htmlLink: response.data.htmlLink,
        title: response.data.summary,
        startTime: response.data.start.dateTime || response.data.start.date,
        endTime: response.data.end.dateTime || response.data.end.date
      };
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      throw new Error(`Failed to create event: ${error.message}`);
    }
  }

  /**
   * Get calendar events
   */
  async getEvents(accessToken, startDate, endDate) {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250
      });

      return response.data.items.map(event => ({
        id: event.id,
        title: event.summary || '(No title)',
        description: event.description || '',
        startTime: event.start.dateTime || event.start.date,
        endTime: event.end.dateTime || event.end.date,
        location: event.location || '',
        htmlLink: event.htmlLink
      }));
    } catch (error) {
      console.error('Error getting Google Calendar events:', error);
      throw new Error('Failed to get calendar events');
    }
  }

  /**
   * Update calendar event
   */
  async updateEvent(accessToken, eventId, eventData) {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const event = {
        summary: eventData.title,
        description: eventData.description || '',
        start: {
          dateTime: eventData.startTime instanceof Date
            ? eventData.startTime.toISOString()
            : new Date(eventData.startTime).toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: eventData.endTime instanceof Date
            ? eventData.endTime.toISOString()
            : new Date(eventData.endTime).toISOString(),
          timeZone: 'UTC'
        }
      };

      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event
      });

      return {
        id: response.data.id,
        htmlLink: response.data.htmlLink
      };
    } catch (error) {
      console.error('Error updating Google Calendar event:', error);
      throw new Error('Failed to update event');
    }
  }

  /**
   * Delete calendar event
   */
  async deleteEvent(accessToken, eventId) {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error);
      throw new Error('Failed to delete event');
    }
  }
}

module.exports = new GoogleCalendarService();
