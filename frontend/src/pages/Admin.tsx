import React, { useState, useEffect } from 'react';
import { Users, CreditCard, Ticket, Activity, Settings, TrendingUp, CheckCircle, AlertCircle, Search, Shield, ShieldOff, UserCheck, UserX, XCircle, DollarSign, Calendar } from 'lucide-react';
import { adminService, AdminStats, User, Subscription } from '../services/adminService';
import toast from 'react-hot-toast';

const Admin: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'subscriptions' | 'tickets' | 'activity' | 'settings'>('overview');

  // User Management State
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Subscription Management State
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [subStatusFilter, setSubStatusFilter] = useState('');
  const [subCurrentPage, setSubCurrentPage] = useState(1);
  const [subTotalPages, setSubTotalPages] = useState(1);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'subscriptions') {
      fetchSubscriptions();
    }
  }, [activeTab, currentPage, userSearch, userStatusFilter, subCurrentPage, subStatusFilter]);

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

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await adminService.getUsers(currentPage, 50, userSearch, userStatusFilter);
      setUsers(response.users);
      setTotalPages(response.pagination.totalPages);
    } catch (error: any) {
      toast.error('Failed to load users');
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await adminService.updateUserStatus(userId, !currentStatus);
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
      fetchStats(); // Refresh stats
    } catch (error: any) {
      toast.error('Failed to update user status');
      console.error('Error updating user status:', error);
    }
  };

  const handleToggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await adminService.updateUserAdmin(userId, !currentStatus, []);
      toast.success(`Admin privileges ${!currentStatus ? 'granted' : 'revoked'} successfully`);
      fetchUsers();
    } catch (error: any) {
      toast.error('Failed to update admin status');
      console.error('Error updating admin status:', error);
    }
  };

  const fetchSubscriptions = async () => {
    setSubscriptionsLoading(true);
    try {
      const response = await adminService.getSubscriptions(subCurrentPage, 50, subStatusFilter);
      setSubscriptions(response.subscriptions);
      setSubTotalPages(response.pagination.totalPages);
    } catch (error: any) {
      toast.error('Failed to load subscriptions');
      console.error('Error fetching subscriptions:', error);
    } finally {
      setSubscriptionsLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!window.confirm('Are you sure you want to cancel this subscription? This action cannot be undone.')) {
      return;
    }

    try {
      await adminService.cancelSubscription(subscriptionId);
      toast.success('Subscription canceled successfully');
      fetchSubscriptions();
      fetchStats(); // Refresh stats
    } catch (error: any) {
      toast.error('Failed to cancel subscription');
      console.error('Error canceling subscription:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trialing':
        return 'bg-blue-100 text-blue-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      case 'canceled':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'incomplete':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={userSearch}
                      onChange={(e) => {
                        setUserSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={userStatusFilter}
                    onChange={(e) => {
                      setUserStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Users</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>

                {/* Users Table */}
                {usersLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No users found</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Joined
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 flex-shrink-0">
                                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                      <span className="text-primary-700 font-medium text-sm">
                                        {user.name.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{user.email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {new Date(user.created_at).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  user.is_active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {user.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  {user.is_superadmin && (
                                    <span className="px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-800">
                                      Superadmin
                                    </span>
                                  )}
                                  {user.is_admin && !user.is_superadmin && (
                                    <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                                      Admin
                                    </span>
                                  )}
                                  {!user.is_admin && !user.is_superadmin && (
                                    <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">
                                      User
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                  {!user.is_superadmin && (
                                    <>
                                      <button
                                        onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                                        className={`p-2 rounded-lg transition-colors ${
                                          user.is_active
                                            ? 'text-red-600 hover:bg-red-50'
                                            : 'text-green-600 hover:bg-green-50'
                                        }`}
                                        title={user.is_active ? 'Deactivate user' : 'Activate user'}
                                      >
                                        {user.is_active ? (
                                          <UserX className="w-5 h-5" />
                                        ) : (
                                          <UserCheck className="w-5 h-5" />
                                        )}
                                      </button>
                                      <button
                                        onClick={() => handleToggleAdminStatus(user.id, user.is_admin)}
                                        className={`p-2 rounded-lg transition-colors ${
                                          user.is_admin
                                            ? 'text-orange-600 hover:bg-orange-50'
                                            : 'text-blue-600 hover:bg-blue-50'
                                        }`}
                                        title={user.is_admin ? 'Revoke admin' : 'Grant admin'}
                                      >
                                        {user.is_admin ? (
                                          <ShieldOff className="w-5 h-5" />
                                        ) : (
                                          <Shield className="w-5 h-5" />
                                        )}
                                      </button>
                                    </>
                                  )}
                                  {user.is_superadmin && (
                                    <span className="text-xs text-gray-500 italic">Protected</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6 px-4">
                        <div className="text-sm text-gray-700">
                          Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'subscriptions' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Subscription Management</h2>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <select
                    value={subStatusFilter}
                    onChange={(e) => {
                      setSubStatusFilter(e.target.value);
                      setSubCurrentPage(1);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Subscriptions</option>
                    <option value="active">Active</option>
                    <option value="trialing">Trialing</option>
                    <option value="past_due">Past Due</option>
                    <option value="canceled">Canceled</option>
                    <option value="incomplete">Incomplete</option>
                  </select>
                </div>

                {/* Subscriptions Table */}
                {subscriptionsLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
                  </div>
                ) : subscriptions.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No subscriptions found</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Period
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Trial Ends
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Created
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {subscriptions.map((sub) => (
                            <tr key={sub.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 flex-shrink-0">
                                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                      <span className="text-primary-700 font-medium text-sm">
                                        {sub.users.name.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{sub.users.name}</div>
                                    <div className="text-sm text-gray-500">{sub.users.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(sub.status)}`}>
                                  {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-900">
                                  <DollarSign className="w-4 h-4 mr-1" />
                                  {(sub.amount / 100).toFixed(2)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {new Date(sub.current_period_start).toLocaleDateString()} -
                                </div>
                                <div className="text-sm text-gray-500">
                                  {new Date(sub.current_period_end).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {sub.trial_end ? (
                                  <div className="flex items-center text-sm text-blue-600">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {new Date(sub.trial_end).toLocaleDateString()}
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">N/A</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {new Date(sub.created_at).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                {sub.status !== 'canceled' && sub.status !== 'cancelled' && (
                                  <button
                                    onClick={() => handleCancelSubscription(sub.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Cancel subscription"
                                  >
                                    <XCircle className="w-5 h-5" />
                                  </button>
                                )}
                                {(sub.status === 'canceled' || sub.status === 'cancelled') && sub.canceled_at && (
                                  <div className="text-xs text-gray-500">
                                    Canceled {new Date(sub.canceled_at).toLocaleDateString()}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {subTotalPages > 1 && (
                      <div className="flex items-center justify-between mt-6 px-4">
                        <div className="text-sm text-gray-700">
                          Page {subCurrentPage} of {subTotalPages}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSubCurrentPage(p => Math.max(1, p - 1))}
                            disabled={subCurrentPage === 1}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setSubCurrentPage(p => Math.min(subTotalPages, p + 1))}
                            disabled={subCurrentPage === subTotalPages}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
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
