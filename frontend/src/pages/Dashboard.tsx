import React, { useEffect, useState } from 'react';
import { dashboardService, DashboardData } from '../services/dashboardService';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Calendar,
  Target
} from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const dashboardData = await dashboardService.getDashboardData();
      setData(dashboardData);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    {
      name: 'Total Tasks',
      value: data.stats.totalTasks,
      icon: Target,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      name: 'Completed',
      value: data.stats.completedTasks,
      icon: CheckCircle2,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      name: 'In Progress',
      value: data.stats.inProgressTasks,
      icon: Clock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      name: 'Overdue',
      value: data.stats.overdueTasks,
      icon: AlertCircle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Here's what's happening with your tasks today</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-xl`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Productivity Score */}
      <div className="card bg-gradient-to-r from-primary-500 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-90">Productivity Score</p>
            <div className="flex items-center mt-2">
              <span className="text-4xl font-bold">{data.stats.productivityScore}</span>
              <span className="text-2xl ml-1">/100</span>
            </div>
            <p className="text-sm opacity-90 mt-2">
              Completion Rate: {data.stats.completionRate}%
            </p>
          </div>
          <TrendingUp className="w-16 h-16 opacity-50" />
        </div>
      </div>

      {/* Tasks Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-primary-600" />
              Today's Tasks
            </h2>
            <Link to="/tasks" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all <ArrowRight className="inline w-4 h-4" />
            </Link>
          </div>

          {data.todayTasks.length > 0 ? (
            <div className="space-y-3">
              {data.todayTasks.slice(0, 5).map((task) => (
                <div
                  key={task._id}
                  className="flex items-start p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all"
                >
                  <input
                    type="checkbox"
                    checked={task.status === 'completed'}
                    className="mt-1 mr-3"
                    readOnly
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}>
                      {task.title}
                    </p>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                        task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-gray-500">{task.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No tasks due today</p>
            </div>
          )}
        </div>

        {/* Upcoming Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-primary-600" />
              Upcoming Tasks
            </h2>
          </div>

          {data.upcomingTasks.length > 0 ? (
            <div className="space-y-3">
              {data.upcomingTasks.slice(0, 5).map((task) => (
                <div
                  key={task._id}
                  className="flex items-start p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className="text-xs text-gray-500">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                        task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No upcoming tasks</p>
            </div>
          )}
        </div>
      </div>

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Projects</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.projects.map((project) => (
              <div
                key={project._id}
                className="p-4 rounded-lg border-2 border-gray-200 hover:border-primary-300 transition-all"
              >
                <div className="flex items-center mb-2">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: project.color }}
                  />
                  <h3 className="font-medium text-gray-900">{project.name}</h3>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  {project.stats.completedTasks} / {project.stats.totalTasks} tasks completed
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
