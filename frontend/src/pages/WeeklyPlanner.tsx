import React, { useState } from 'react';
import { aiService, WeeklyPlan } from '../services/aiService';
import { Calendar, ChevronLeft, ChevronRight, Loader2, Sparkles, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

const WeeklyPlanner: React.FC = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(0);

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

  const handleGenerateWeeklyPlan = async () => {
    setIsGenerating(true);
    try {
      const response = await aiService.generateWeeklyPlan(formatDate(currentWeekStart));
      setWeeklyPlan(response.plan);
      toast.success('Weekly plan generated successfully!');
    } catch (error: any) {
      console.error('Error generating weekly plan:', error);
      toast.error(error.response?.data?.error || 'Failed to generate weekly plan');
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

        <div className="mt-4">
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
                Generate AI Weekly Plan
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
