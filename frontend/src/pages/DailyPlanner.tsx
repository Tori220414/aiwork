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
  const [syncToOutlook, setSyncToOutlook] = useState(true);

  useEffect(() => {
    checkOutlookConnection();
  }, []);

  const checkOutlookConnection = async () => {
    try {
      const status = await calendarService.getOutlookStatus();
      setOutlookConnected(status.connected);
    } catch (error) {
      console.error('Failed to check Outlook connection:', error);
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
        syncToOutlook && outlookConnected
      );

      // The response.plan is typed as DailyPlan | WeeklyPlan, but we know it's DailyPlan for this endpoint
      if (response.plan && !('days' in response.plan)) {
        setDailyPlan(response.plan);
      }

      if (response.syncedToOutlook && response.syncedEvents && response.syncedEvents.length > 0) {
        toast.success(
          `Daily plan generated and ${response.syncedEvents.length} events synced to Outlook!`,
          { duration: 5000 }
        );
      } else if (response.syncError) {
        toast.success('Daily plan generated successfully!');
        toast.error(`Outlook sync failed: ${response.syncError}`, { duration: 5000 });
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
    setDailyPlan(null);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
    setDailyPlan(null);
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
                <Cloud className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-900">Sync to Outlook Calendar</span>
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
                {syncToOutlook && outlookConnected ? 'Generate & Sync to Outlook' : 'Generate AI Daily Plan'}
              </>
            )}
          </button>
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
