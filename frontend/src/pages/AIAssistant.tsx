import React, { useState } from 'react';
import { aiService } from '../services/aiService';
import { Bot, Sparkles, Calendar, TrendingUp, Users, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTaskStore } from '../store/useTaskStore';

const AIAssistant: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'extract' | 'prioritize' | 'plan' | 'analytics'>('extract');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { fetchTasks } = useTaskStore();

  const features = [
    {
      id: 'extract',
      title: 'Task Input',
      icon: Sparkles,
      description: 'Paste an email, meeting notes, or any text and AI will extract actionable tasks'
    },
    {
      id: 'plan',
      title: 'Daily Plan',
      icon: Calendar,
      description: 'Generate an optimized daily schedule based on your tasks'
    },
    {
      id: 'analytics',
      title: 'Productivity Analytics',
      icon: TrendingUp,
      description: 'Get AI-powered insights into your productivity patterns'
    }
  ];

  const handleExtractTasks = async () => {
    if (!inputText.trim()) {
      toast.error('Please enter some text');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await aiService.extractTasksFromText(inputText);
      setResult(response);
      toast.success(`Created ${response.tasks.length} tasks!`);
      setInputText('');
      // Refresh tasks list
      await fetchTasks();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to extract tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await aiService.generateDailyPlan();
      setResult(response);
      toast.success('Daily plan generated!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate plan');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalytics = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await aiService.getProductivityAnalysis('7d');
      setResult(response);
      toast.success('Analytics generated!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to get analytics');
    } finally {
      setLoading(false);
    }
  };

  const renderExtractInterface = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Paste your text (email, meeting notes, message, etc.)
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Example: Hi team, tomorrow we need to review the Q4 budget by 2pm, and don't forget to update the client presentation by EOD. Also, schedule a meeting with marketing for next week."
          className="input min-h-[200px] font-mono text-sm"
          disabled={loading}
        />
      </div>

      <button
        onClick={handleExtractTasks}
        disabled={loading || !inputText.trim()}
        className="btn btn-primary w-full flex items-center justify-center"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            Extract Tasks with AI
          </>
        )}
      </button>

      {result && result.tasks && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-900 mb-2">
            ✅ Successfully created {result.tasks.length} tasks!
          </h3>
          <div className="space-y-2">
            {result.tasks.map((task: any, index: number) => (
              <div key={index} className="bg-white p-3 rounded border border-green-200">
                <p className="font-medium text-gray-900">{task.title}</p>
                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs px-2 py-1 rounded bg-gray-100">
                    {task.priority}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100">
                    {task.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderPlanInterface = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-900">
          🤖 AI will analyze your tasks and create an optimized daily schedule based on priority,
          estimated time, and your working hours.
        </p>
      </div>

      <button
        onClick={handleGeneratePlan}
        disabled={loading}
        className="btn btn-primary w-full flex items-center justify-center"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
        ) : (
          <>
            <Calendar className="w-5 h-5 mr-2" />
            Generate Daily Plan
          </>
        )}
      </button>

      {result && result.plan && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
            <h3 className="font-semibold text-primary-900 mb-2">📅 Your Daily Plan</h3>
            <p className="text-sm text-primary-800">{result.plan.summary}</p>
            <div className="mt-2">
              <span className="text-sm font-medium text-primary-900">
                Estimated Productivity: {result.plan.estimatedProductivity}%
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {result.plan.timeBlocks?.map((block: any, index: number) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{block.taskTitle}</p>
                    <p className="text-sm text-gray-600 mt-1">{block.notes}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {block.startTime} - {block.endTime}
                    </p>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100">
                      {block.type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {result.plan.tips && result.plan.tips.length > 0 && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-900 mb-2">💡 Productivity Tips</h4>
              <ul className="space-y-1">
                {result.plan.tips.map((tip: string, index: number) => (
                  <li key={index} className="text-sm text-yellow-800">• {tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderAnalyticsInterface = () => (
    <div className="space-y-4">
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <p className="text-sm text-purple-900">
          📊 Get AI-powered insights into your productivity patterns, strengths, and areas for improvement.
        </p>
      </div>

      <button
        onClick={handleAnalytics}
        disabled={loading}
        className="btn btn-primary w-full flex items-center justify-center"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
        ) : (
          <>
            <TrendingUp className="w-5 h-5 mr-2" />
            Analyze My Productivity
          </>
        )}
      </button>

      {result && result.analysis && (
        <div className="mt-6 space-y-4">
          <div className="p-6 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg">
            <h3 className="text-xl font-bold mb-2">Productivity Score</h3>
            <p className="text-5xl font-bold">{result.analysis.productivityScore}/100</p>
            <p className="text-sm mt-2 opacity-90">Based on {result.dataPoints} completed tasks</p>
          </div>

          {result.analysis.insights && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">🎯 Key Insights</h4>
              <p className="text-sm text-blue-800">{result.analysis.insights}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">💪 Your Strengths</h4>
              <ul className="space-y-1">
                {result.analysis.strengths?.map((strength: string, index: number) => (
                  <li key={index} className="text-sm text-green-800">• {strength}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-2">🎯 Areas to Improve</h4>
              <ul className="space-y-1">
                {result.analysis.improvements?.map((improvement: string, index: number) => (
                  <li key={index} className="text-sm text-orange-800">• {improvement}</li>
                ))}
              </ul>
            </div>
          </div>

          {result.analysis.patterns && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">📈 Patterns</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Most Productive Time</p>
                  <p className="text-sm font-medium text-gray-900">
                    {result.analysis.patterns.mostProductiveTime}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Completion Rate</p>
                  <p className="text-sm font-medium text-gray-900">
                    {result.analysis.patterns.taskCompletionRate}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Avg Task Time</p>
                  <p className="text-sm font-medium text-gray-900">
                    {result.analysis.patterns.averageTaskTime} min
                  </p>
                </div>
              </div>
            </div>
          )}

          {result.analysis.recommendations && result.analysis.recommendations.length > 0 && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-900 mb-2">💡 Recommendations</h4>
              <ul className="space-y-1">
                {result.analysis.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="text-sm text-yellow-800">• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl mb-4">
          <Bot className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">AI Assistant</h1>
        <p className="text-gray-600 mt-1">Let AI help you manage your tasks smarter</p>
      </div>

      {/* Feature Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map((feature) => (
          <button
            key={feature.id}
            onClick={() => {
              setActiveTab(feature.id as any);
              setResult(null);
              setInputText('');
            }}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              activeTab === feature.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-primary-300 bg-white'
            }`}
          >
            <feature.icon className={`w-8 h-8 mb-3 ${
              activeTab === feature.id ? 'text-primary-600' : 'text-gray-400'
            }`} />
            <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
            <p className="text-sm text-gray-600">{feature.description}</p>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="card min-h-[400px]">
        {activeTab === 'extract' && renderExtractInterface()}
        {activeTab === 'plan' && renderPlanInterface()}
        {activeTab === 'analytics' && renderAnalyticsInterface()}
      </div>
    </div>
  );
};

export default AIAssistant;
