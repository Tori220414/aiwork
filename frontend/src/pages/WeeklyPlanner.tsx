import React, { useState, useEffect } from 'react';
import { aiService, WeeklyPlan } from '../services/aiService';
import { Calendar, ChevronLeft, ChevronRight, Loader2, Sparkles, TrendingUp, Cloud, CloudOff } from 'lucide-react';
import toast from 'react-hot-toast';
import plannerService from '../services/plannerService';
import calendarService from '../services/calendarService';

const WeeklyPlanner: React.FC = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [syncToOutlook, setSyncToOutlook] = useState(true);
  const [syncToGoogle, setSyncToGoogle] = useState(true);

  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    return new Date(d.setDate(diff));
  }

  function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  function addWeeks(date: Date, weeks: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + weeks * 7);
    return result;
  }

  useEffect(() => {
    checkCalendarConnections();
  }, []);

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

  const handleGenerateWeeklyPlan = async () => {
    setIsGenerating(true);
    try {
      const response = await plannerService.generateWeeklyPlan(
        formatDate(currentWeekStart),
        syncToOutlook && outlookConnected,
        syncToGoogle && googleConnected
      );

      // The response.plan is typed as DailyPlan | WeeklyPlan, but we know it's WeeklyPlan for this endpoint
      if (response.plan && 'days' in response.plan) {
        setWeeklyPlan(response.plan);
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
        toast.success(`Weekly plan generated! ${syncMessages.join(', ')}`, { duration: 5000 });
      } else {
        toast.success('Weekly plan generated successfully!');
      }
    } catch (error: any) {
      console.error('Error generating weekly plan:', error);
      toast.error(error.message || 'Failed to generate weekly plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = addWeeks(currentWeekStart, direction === 'next' ? 1 : -1);
    setCurrentWeekStart(newWeekStart);
    setWeeklyPlan(null);
  };

  const getWeekDateRange = () => {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return `${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Weekly Planner</h1>
          </div>
          <p className="text-gray-600 ml-14">AI-powered weekly schedule optimization</p>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">{getWeekDateRange()}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {currentWeekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          <button
            onClick={() => navigateWeek('next')}
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
            onClick={handleGenerateWeeklyPlan}
            disabled={isGenerating}
            className="w-full flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Weekly Plan...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                {(syncToOutlook && outlookConnected) || (syncToGoogle && googleConnected)
                  ? 'Generate & Sync to Calendar'
                  : 'Generate AI Weekly Plan'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Weekly Plan Display */}
      {weeklyPlan && (
        <>
          {/* Weekly Summary */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
            <h3 className="text-2xl font-bold mb-3">Weekly Overview</h3>
            <p className="text-indigo-100 mb-4">{weeklyPlan.summary}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                <p className="text-sm text-indigo-100">Total Tasks</p>
                <p className="text-2xl font-bold">{weeklyPlan.totalTasks}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                <p className="text-sm text-indigo-100">Estimated Hours</p>
                <p className="text-2xl font-bold">{weeklyPlan.totalEstimatedHours}h</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                <p className="text-sm text-indigo-100">Balance Score</p>
                <p className="text-2xl font-bold">{weeklyPlan.balanceScore}%</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                <p className="text-sm text-indigo-100">Working Days</p>
                <p className="text-2xl font-bold">{weeklyPlan.days.length}</p>
              </div>
            </div>

            {weeklyPlan.weeklyGoals && weeklyPlan.weeklyGoals.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <h4 className="font-semibold mb-2 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Weekly Goals
                </h4>
                <ul className="space-y-1">
                  {weeklyPlan.weeklyGoals.map((goal, index) => (
                    <li key={index} className="text-sm text-indigo-100">• {goal}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Day Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex overflow-x-auto border-b border-gray-200">
              {weeklyPlan.days.map((day, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedDay(index)}
                  className={`flex-1 min-w-[120px] px-4 py-3 text-sm font-medium transition-colors ${
                    selectedDay === index
                      ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div>{day.dayName}</div>
                  <div className="text-xs mt-1 opacity-75">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-xs mt-1 font-semibold">
                    {day.tasksCount} tasks
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Day Content */}
            <div className="p-6">
              {weeklyPlan.days[selectedDay] && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Daily Summary</h4>
                    <p className="text-sm text-blue-800">{weeklyPlan.days[selectedDay].plan.summary}</p>
                    {weeklyPlan.days[selectedDay].plan.estimatedProductivity && (
                      <div className="mt-2">
                        <span className="text-sm font-medium text-blue-900">
                          Estimated Productivity: {weeklyPlan.days[selectedDay].plan.estimatedProductivity}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Time Blocks */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Schedule</h4>
                    {weeklyPlan.days[selectedDay].plan.timeBlocks?.map((block, blockIndex) => (
                      <div key={blockIndex} className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                {block.startTime} - {block.endTime}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded border ${
                                block.type === 'deep-work' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                block.type === 'meeting' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                block.type === 'break' ? 'bg-green-100 text-green-800 border-green-200' :
                                'bg-gray-100 text-gray-800 border-gray-200'
                              }`}>
                                {block.type}
                              </span>
                            </div>
                            <h5 className="font-medium text-gray-900 mb-1">{block.taskTitle}</h5>
                            <p className="text-sm text-gray-600">{block.notes}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Daily Tips */}
                  {weeklyPlan.days[selectedDay].plan.tips && weeklyPlan.days[selectedDay].plan.tips.length > 0 && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h4 className="font-semibold text-yellow-900 mb-2">💡 Tips for this day</h4>
                      <ul className="space-y-1">
                        {weeklyPlan.days[selectedDay].plan.tips.map((tip, tipIndex) => (
                          <li key={tipIndex} className="text-sm text-yellow-800">• {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!weeklyPlan && !isGenerating && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Weekly Plan Yet</h3>
          <p className="text-gray-600 mb-4">
            Generate an AI-powered weekly plan based on your tasks and work preferences
          </p>
        </div>
      )}
    </div>
  );
};

export default WeeklyPlanner;
