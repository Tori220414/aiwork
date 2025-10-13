import React, { useState, useEffect } from 'react';
import { Users, CreditCard, Ticket, Activity, Settings, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { adminService, AdminStats } from '../services/adminService';
import toast from 'react-hot-toast';

const Admin: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'subscriptions' | 'tickets' | 'activity' | 'settings'>('overview');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await adminService.getStats();
      setStats(data);
    } catch (error: any) {
      toast.error('Failed to load admin statistics');
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-lg text-gray-600">Aurora Tasks by Aurora Designs</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                <p className="text-sm text-blue-600 mt-1">
                  +{stats?.newUsersThisMonth || 0} this month
                </p>
              </div>
              <Users className="w-12 h-12 text-blue-500 opacity-80" />
            </div>
          </div>

          {/* Active Subscriptions */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Subscriptions</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.activeSubscriptions || 0}</p>
                <p className="text-sm text-green-600 mt-1">
                  ${((stats?.revenueThisMonth || 0) / 100).toFixed(2)} this month
                </p>
              </div>
              <CreditCard className="w-12 h-12 text-green-500 opacity-80" />
            </div>
          </div>

          {/* Revenue This Month */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Revenue This Month</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${((stats?.revenueThisMonth || 0) / 100).toFixed(2)}
                </p>
                <p className="text-sm text-purple-600 mt-1">Monthly recurring</p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-500 opacity-80" />
            </div>
          </div>

          {/* Total Tasks */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalTasks || 0}</p>
                <p className="text-sm text-orange-600 mt-1">Across all users</p>
              </div>
              <CheckCircle className="w-12 h-12 text-orange-500 opacity-80" />
            </div>
          </div>

          {/* Open Tickets */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Open Support Tickets</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.openTickets || 0}</p>
                <p className="text-sm text-red-600 mt-1">Needs attention</p>
              </div>
              <Ticket className="w-12 h-12 text-red-500 opacity-80" />
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-teal-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">System Health</p>
                <p className="text-3xl font-bold text-gray-900">100%</p>
                <p className="text-sm text-teal-600 mt-1">All services operational</p>
              </div>
              <Activity className="w-12 h-12 text-teal-500 opacity-80" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Tab Headers */}
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${
                  activeTab === 'users'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('subscriptions')}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${
                  activeTab === 'subscriptions'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Subscriptions
              </button>
              <button
                onClick={() => setActiveTab('tickets')}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${
                  activeTab === 'tickets'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Support Tickets
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${
                  activeTab === 'activity'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Activity Log
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Settings
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setActiveTab('users')}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
                  >
                    <Users className="w-6 h-6 text-primary-600 mb-2" />
                    <h3 className="font-semibold text-gray-900">Manage Users</h3>
                    <p className="text-sm text-gray-600 mt-1">View and manage user accounts</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('tickets')}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
                  >
                    <Ticket className="w-6 h-6 text-primary-600 mb-2" />
                    <h3 className="font-semibold text-gray-900">Support Tickets</h3>
                    <p className="text-sm text-gray-600 mt-1">Handle user support requests</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('subscriptions')}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
                  >
                    <CreditCard className="w-6 h-6 text-primary-600 mb-2" />
                    <h3 className="font-semibold text-gray-900">Subscriptions</h3>
                    <p className="text-sm text-gray-600 mt-1">Manage billing and subscriptions</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
                  >
                    <Settings className="w-6 h-6 text-primary-600 mb-2" />
                    <h3 className="font-semibold text-gray-900">System Settings</h3>
                    <p className="text-sm text-gray-600 mt-1">Configure system parameters</p>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">User Management</h2>
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">User management interface coming soon</p>
                  <p className="text-sm text-gray-500">
                    View, activate/deactivate users, and manage admin permissions
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'subscriptions' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Subscription Management</h2>
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Subscription management interface coming soon</p>
                  <p className="text-sm text-gray-500">
                    View subscription details and manage billing
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'tickets' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Support Tickets</h2>
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Support ticket interface coming soon</p>
                  <p className="text-sm text-gray-500">
                    View, respond to, and manage user support requests
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Activity Log</h2>
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Activity log interface coming soon</p>
                  <p className="text-sm text-gray-500">
                    View audit trail of all admin actions
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">System Settings</h2>
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">System settings interface coming soon</p>
                  <p className="text-sm text-gray-500">
                    Configure maintenance mode, limits, and other system parameters
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
