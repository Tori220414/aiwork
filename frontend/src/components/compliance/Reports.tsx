import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertCircle, CheckCircle2, Clock, Download, FileText, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedAt: string | null;
}

interface ChecklistInstance {
  id: string;
  name: string;
  industry: string;
  category?: string;
  items: ChecklistItem[];
  status: 'in_progress' | 'completed' | 'overdue';
  due_date?: string;
  completed_at?: string;
  assigned_to?: string;
  created_at: string;
}

interface ReportsProps {
  workspaceId: string;
}

const Reports: React.FC<ReportsProps> = ({ workspaceId }) => {
  const [instances, setInstances] = useState<ChecklistInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days

  useEffect(() => {
    fetchInstances();
  }, [workspaceId]);

  const fetchInstances = async () => {
    try {
      const response = await api.get(`/workspaces/${workspaceId}/instances`);
      setInstances(response.data.instances || []);
    } catch (error: any) {
      console.error('Error fetching instances:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load report data');
      }
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (instance: ChecklistInstance) => {
    if (!instance.due_date || instance.status === 'completed') return false;
    return new Date(instance.due_date) < new Date();
  };

  const getFilteredInstances = () => {
    const days = parseInt(dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return instances.filter(instance =>
      new Date(instance.created_at) >= cutoffDate
    );
  };

  const filteredInstances = getFilteredInstances();

  // Calculate statistics
  const totalChecklists = filteredInstances.length;
  const completedChecklists = filteredInstances.filter(i => i.status === 'completed').length;
  const inProgressChecklists = filteredInstances.filter(i => i.status === 'in_progress' && !isOverdue(i)).length;
  const overdueChecklists = filteredInstances.filter(i => isOverdue(i)).length;

  const completionRate = totalChecklists > 0 ? (completedChecklists / totalChecklists) * 100 : 0;

  const totalItems = filteredInstances.reduce((sum, i) => sum + i.items.length, 0);
  const completedItems = filteredInstances.reduce((sum, i) =>
    sum + i.items.filter(item => item.completed).length, 0
  );
  const itemCompletionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  // Group by industry
  const byIndustry = filteredInstances.reduce((acc, instance) => {
    const industry = instance.industry || 'Other';
    if (!acc[industry]) {
      acc[industry] = { total: 0, completed: 0 };
    }
    acc[industry].total++;
    if (instance.status === 'completed') {
      acc[industry].completed++;
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number }>);

  // Group by category
  const byCategory = filteredInstances.reduce((acc, instance) => {
    const category = instance.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = { total: 0, completed: 0 };
    }
    acc[category].total++;
    if (instance.status === 'completed') {
      acc[category].completed++;
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number }>);

  // Upcoming due dates
  const upcomingDue = filteredInstances
    .filter(i => i.due_date && !isOverdue(i) && i.status !== 'completed')
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5);

  // Recent completions
  const recentCompletions = filteredInstances
    .filter(i => i.completed_at)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
    .slice(0, 5);

  const exportReport = () => {
    const csv = [
      ['Compliance Report'],
      ['Generated', new Date().toLocaleString()],
      ['Period', `Last ${dateRange} days`],
      [''],
      ['Overview'],
      ['Total Checklists', totalChecklists],
      ['Completed', completedChecklists],
      ['In Progress', inProgressChecklists],
      ['Overdue', overdueChecklists],
      ['Completion Rate', `${completionRate.toFixed(1)}%`],
      ['Item Completion Rate', `${itemCompletionRate.toFixed(1)}%`],
      [''],
      ['By Industry'],
      ['Industry', 'Total', 'Completed', 'Rate'],
      ...Object.entries(byIndustry).map(([industry, data]) => [
        industry,
        data.total,
        data.completed,
        `${((data.completed / data.total) * 100).toFixed(1)}%`
      ]),
      [''],
      ['By Category'],
      ['Category', 'Total', 'Completed', 'Rate'],
      ...Object.entries(byCategory).map(([category, data]) => [
        category,
        data.total,
        data.completed,
        `${((data.completed / data.total) * 100).toFixed(1)}%`
      ]),
      [''],
      ['Overdue Checklists'],
      ['Name', 'Industry', 'Due Date', 'Assigned To'],
      ...filteredInstances
        .filter(i => isOverdue(i))
        .map(i => [
          i.name,
          i.industry,
          i.due_date ? new Date(i.due_date).toLocaleDateString() : '',
          i.assigned_to || 'Unassigned'
        ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `compliance-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">Compliance performance insights</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{totalChecklists}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Total Checklists</h3>
          <p className="text-xs text-gray-500 mt-1">In selected period</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{completedChecklists}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Completed</h3>
          <p className="text-xs text-green-600 mt-1 font-medium">{completionRate.toFixed(1)}% completion rate</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{inProgressChecklists}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">In Progress</h3>
          <p className="text-xs text-gray-500 mt-1">Active checklists</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{overdueChecklists}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Overdue</h3>
          <p className="text-xs text-red-600 mt-1 font-medium">Requires attention</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Industry */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Checklists by Industry</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(byIndustry).length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No data available</p>
            ) : (
              Object.entries(byIndustry).map(([industry, data]) => {
                const rate = (data.completed / data.total) * 100;
                return (
                  <div key={industry}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{industry}</span>
                      <span className="text-gray-500">
                        {data.completed}/{data.total} ({rate.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* By Category */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Checklists by Category</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(byCategory).length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No data available</p>
            ) : (
              Object.entries(byCategory).map(([category, data]) => {
                const rate = (data.completed / data.total) * 100;
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{category}</span>
                      <span className="text-gray-500">
                        {data.completed}/{data.total} ({rate.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Due */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Due Dates</h3>
          </div>
          {upcomingDue.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No upcoming due dates</p>
          ) : (
            <div className="space-y-3">
              {upcomingDue.map((instance) => (
                <div key={instance.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{instance.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{instance.industry}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-600">
                      {new Date(instance.due_date!).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.ceil((new Date(instance.due_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Completions */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Completions</h3>
          </div>
          {recentCompletions.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No recent completions</p>
          ) : (
            <div className="space-y-3">
              {recentCompletions.map((instance) => (
                <div key={instance.id} className="flex items-start justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{instance.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{instance.industry}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">
                      {new Date(instance.completed_at!).toLocaleDateString()}
                    </p>
                    {instance.assigned_to && (
                      <p className="text-xs text-gray-500 mt-1">{instance.assigned_to}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Item Completion Stats */}
      <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Item Completion Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">Total Items</p>
            <p className="text-3xl font-bold text-gray-900">{totalItems}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Completed Items</p>
            <p className="text-3xl font-bold text-green-600">{completedItems}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Item Completion Rate</p>
            <p className="text-3xl font-bold text-primary-600">{itemCompletionRate.toFixed(1)}%</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-primary-600 to-green-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${itemCompletionRate}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
