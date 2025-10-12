import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, ExternalLink, RefreshCw, Download, Upload } from 'lucide-react';
import calendarService from '../services/calendarService';
import toast from 'react-hot-toast';

const CalendarSettings: React.FC = () => {
  const [outlookStatus, setOutlookStatus] = useState<{ connected: boolean; email?: string }>({ connected: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    loadOutlookStatus();
  }, []);

  const loadOutlookStatus = async () => {
    setIsLoading(true);
    try {
      const status = await calendarService.getOutlookStatus();
      setOutlookStatus(status);
    } catch (error) {
      console.error('Failed to load Outlook status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectOutlook = () => {
    const clientId = process.env.REACT_APP_OUTLOOK_CLIENT_ID;

    if (!clientId) {
      toast.error(
        'Outlook integration not configured. Please contact administrator to set up Microsoft App Registration.',
        { duration: 5000 }
      );
      return;
    }

    setIsConnecting(true);
    const authUrl = calendarService.getOutlookAuthUrl();
    window.location.href = authUrl;
  };

  const handleDisconnectOutlook = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Outlook calendar?')) {
      return;
    }

    try {
      await calendarService.disconnectOutlook();
      setOutlookStatus({ connected: false });
      toast.success('Outlook calendar disconnected');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar Integration</h1>
        </div>
        <p className="text-gray-600 ml-14">
          Connect your calendar to sync tasks and events
        </p>
      </div>

      {/* Outlook Calendar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H5V7h7v10zm8-4h-7v-2h7v2z" fill="#0078D4"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Microsoft Outlook</h3>
              <p className="text-sm text-gray-600 mb-3">
                Sync your tasks with Outlook calendar and import events
              </p>

              {isLoading ? (
                <div className="flex items-center text-sm text-gray-500">
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Checking connection...
                </div>
              ) : outlookStatus.connected ? (
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Connected as {outlookStatus.email}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={loadOutlookStatus}
                      className="flex items-center px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Refresh
                    </button>
                    <button
                      onClick={handleDisconnectOutlook}
                      className="flex items-center px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleConnectOutlook}
                  disabled={isConnecting}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Connect Outlook Calendar
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {outlookStatus.connected && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Sync Options</h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="ml-2 text-sm text-gray-700">Automatically sync new tasks to Outlook</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="ml-2 text-sm text-gray-700">Import Outlook events as tasks</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="ml-2 text-sm text-gray-700">Sync task completions back to Outlook</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Setup Instructions */}
      {!process.env.REACT_APP_OUTLOOK_CLIENT_ID && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-900 mb-2">Setup Required</h3>
              <p className="text-sm text-yellow-800 mb-3">
                To enable Outlook calendar integration, you need to configure a Microsoft App Registration:
              </p>
              <ol className="text-sm text-yellow-800 space-y-2 list-decimal list-inside">
                <li>Go to <a href="https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noopener noreferrer" className="underline font-medium">Azure Portal - App Registrations</a></li>
                <li>Click "New registration"</li>
                <li>Set name: "Aurora Tasks Calendar Sync"</li>
                <li>Set redirect URI: <code className="bg-yellow-100 px-1 rounded">{window.location.origin}/auth/outlook/callback</code></li>
                <li>Copy the Application (client) ID</li>
                <li>Add environment variable: <code className="bg-yellow-100 px-1 rounded">REACT_APP_OUTLOOK_CLIENT_ID</code></li>
                <li>Under "API permissions", add: <code className="bg-yellow-100 px-1 rounded">Calendars.ReadWrite</code> and <code className="bg-yellow-100 px-1 rounded">User.Read</code></li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Features Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Calendar Integration Features</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Two-way sync between tasks and calendar events</li>
              <li>• Automatic task creation from calendar events</li>
              <li>• Time blocking based on task duration</li>
              <li>• Meeting preparation from calendar invites</li>
              <li>• Smart conflict detection and resolution</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Coming Soon</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg opacity-60">
            <svg className="w-8 h-8" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <div>
              <p className="font-medium text-gray-900">Google Calendar</p>
              <p className="text-sm text-gray-600">Two-way sync with Google Calendar</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg opacity-60">
            <svg className="w-8 h-8" viewBox="0 0 24 24">
              <path fill="#000" d="M12.5 2C9.5 2 7 4.5 7 7.5c0 1.9 1.2 3.6 3 4.3v10.2c0 .6.4 1 1 1h3c.6 0 1-.4 1-1V11.8c1.8-.7 3-2.4 3-4.3C18 4.5 15.5 2 12.5 2z"/>
            </svg>
            <div>
              <p className="font-medium text-gray-900">Apple Calendar</p>
              <p className="text-sm text-gray-600">iCloud calendar integration</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarSettings;
