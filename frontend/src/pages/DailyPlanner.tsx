import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Loader2, Sparkles, Cloud } from 'lucide-react';
import toast from 'react-hot-toast';
import plannerService, { DailyPlan } from '../services/plannerService';
import calendarService from '../services/calendarService';

const DailyPlanner: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [syncToOutlook, setSyncToOutlook] = useState(true);
  const [syncToGoogle, setSyncToGoogle] = useState(true);

  useEffect(() => {
    checkCalendarConnections();
    loadExistingPlan();
  }, [selectedDate]);

  const checkCalendarConnections = async () => {
    try {
      const [outlook, google] = await Promise.all([
        calendarService.getOutlookStatus(),
        calendarService.getGoogleStatus()
      ]);
      setOutlookConnected(outlook.connected);
      setGoogleConnected(google.connected);
    } catch (error) {
      console.error('Failed to check calendar connections:', error);
    }
  };

  const loadExistingPlan = async () => {
    try {
      const dateStr = formatDate(selectedDate);
      const response = await plannerService.getExistingDailyPlan(dateStr);
      if (response.plan && response.plan.plan_data) {
        setDailyPlan(response.plan.plan_data);
      } else {
        setDailyPlan(null);
      }
    } catch (error) {
      console.error('Failed to load existing plan:', error);
      setDailyPlan(null);
    }
  };

  function formatDate(date: Date): string {
    // Format date as YYYY-MM-DD in local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  const handleGenerateDailyPlan = async () => {
    setIsGenerating(true);
    try {
      const response = await plannerService.generateDailyPlan(
        formatDate(selectedDate),
        syncToOutlook && outlookConnected,
        syncToGoogle && googleConnected
      );

      // The response.plan is typed as DailyPlan | WeeklyPlan, but we know it's DailyPlan for this endpoint
      if (response.plan && !('days' in response.plan)) {
        setDailyPlan(response.plan);
      }

      let syncMessages = [];
      if (response.syncedToOutlook) {
        const outlookCount = response.syncedEvents?.filter(e => 'outlookEventId' in e).length || 0;
        if (outlookCount > 0) syncMessages.push(`${outlookCount} events synced to Outlook`);
      }
      if (response.syncedToGoogle) {
        const googleCount = response.syncedEvents?.filter(e => 'googleEventId' in e).length || 0;
        if (googleCount > 0) syncMessages.push(`${googleCount} events synced to Google Calendar`);
      }
      if (response.syncErrors) {
        toast.error(`Sync errors: ${response.syncErrors}`, { duration: 5000 });
      }

      if (syncMessages.length > 0) {
        toast.success(`Daily plan generated! ${syncMessages.join(', ')}`, { duration: 5000 });
      } else {
        toast.success('Daily plan generated successfully!');
      }
    } catch (error: any) {
      console.error('Error generating daily plan:', error);
      toast.error(error.message || 'Failed to generate daily plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = addDays(selectedDate, direction === 'next' ? 1 : -1);
    setSelectedDate(newDate);
    // Don't clear plan - let useEffect load it
  };

  const goToToday = () => {
    setSelectedDate(new Date());
    // Don't clear plan - let useEffect load it
  };

  const isToday = () => {
    const today = new Date();
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Daily Planner</h1>
          </div>
          <p className="text-gray-600 ml-14">AI-powered daily schedule optimization</p>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateDay('prev')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </h2>
            {!isToday() && (
              <button
                onClick={goToToday}
                className="text-sm text-blue-600 hover:text-blue-700 mt-1"
              >
                Go to Today
              </button>
            )}
          </div>

          <button
            onClick={() => navigateDay('next')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {outlookConnected && (
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H5V7h7v10zm8-4h-7v-2h7v2z" fill="#0078D4"/>
                </svg>
                <span className="text-sm font-medium text-blue-900">Sync to Outlook</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncToOutlook}
                  onChange={(e) => setSyncToOutlook(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          )}
          {googleConnected && (
            <div className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm font-medium text-gray-900">Sync to Google Calendar</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncToGoogle}
                  onChange={(e) => setSyncToGoogle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          )}
          <button
            onClick={handleGenerateDailyPlan}
            disabled={isGenerating}
            className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Daily Plan...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                {dailyPlan
                  ? 'Regenerate & Update Calendar'
                  : (syncToOutlook && outlookConnected) || (syncToGoogle && googleConnected)
                  ? 'Generate & Sync to Calendar'
                  : 'Generate AI Daily Plan'}
              </>
            )}
          </button>
          {dailyPlan && (
            <p className="text-xs text-center text-gray-500 mt-2">
              Plan already exists for this date. Clicking will regenerate and update calendar events.
            </p>
          )}
        </div>
      </div>

      {/* Daily Plan Display */}
      {dailyPlan && (
        <>
          {/* Summary */}
          {dailyPlan.summary && (
            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-2">Daily Summary</h3>
              <p className="text-blue-100">{dailyPlan.summary}</p>
              <div className="mt-4 inline-block bg-white/10 backdrop-blur rounded-lg px-4 py-2">
                <p className="text-sm text-blue-100">Time Blocks</p>
                <p className="text-2xl font-bold">{dailyPlan.timeBlocks?.length || 0}</p>
              </div>
            </div>
          )}

          {/* Time Blocks */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</h3>
            <div className="space-y-3">
              {dailyPlan.timeBlocks?.map((block, index) => (
                <div
                  key={index}
                  className={`border-2 rounded-lg p-4 transition-colors ${
                    block.type === 'break'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {block.startTime} - {block.endTime}
                        </span>
                        {block.type && (
                          <span
                            className={`text-xs px-2 py-1 rounded border ${
                              block.type === 'break'
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : 'bg-blue-100 text-blue-800 border-blue-200'
                            }`}
                          >
                            {block.type}
                          </span>
                        )}
                      </div>
                      {block.taskTitle && (
                        <h5 className="font-medium text-gray-900 mb-1">{block.taskTitle}</h5>
                      )}
                      {block.notes && <p className="text-sm text-gray-600">{block.notes}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!dailyPlan && !isGenerating && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Daily Plan Yet</h3>
          <p className="text-gray-600 mb-4">
            Generate an AI-powered daily plan based on your tasks and work preferences for{' '}
            {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </p>
        </div>
      )}
    </div>
  );
};

export default DailyPlanner;
