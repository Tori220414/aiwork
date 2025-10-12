import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { User, Clock, Briefcase, Calendar, Save, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

interface UserPreferences {
  workType: 'office' | 'remote' | 'hybrid' | 'freelance' | 'student' | 'other';
  workHoursPerDay: number;
  workDaysPerWeek: number;
  workStartTime: string;
  workEndTime: string;
  timezone: string;
  breakDuration: number;
  preferredTaskDuration: number;
  deepWorkPreference: 'morning' | 'afternoon' | 'evening' | 'flexible';
  weekStartsOn: 'monday' | 'sunday';
  defaultTaskView: 'daily' | 'weekly' | 'monthly';
}

const Profile: React.FC = () => {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [preferences, setPreferences] = useState<UserPreferences>({
    workType: 'office',
    workHoursPerDay: 8,
    workDaysPerWeek: 5,
    workStartTime: '09:00',
    workEndTime: '17:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    breakDuration: 60,
    preferredTaskDuration: 30,
    deepWorkPreference: 'morning',
    weekStartsOn: 'monday',
    defaultTaskView: 'daily',
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await api.get('/users/preferences');
      if (response.data.preferences) {
        setPreferences({ ...preferences, ...response.data.preferences });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await api.put('/users/profile', formData);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      await api.put('/users/preferences', { preferences });
      toast.success('Preferences saved successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const workTypeOptions = [
    { value: 'office', label: 'Office Work', icon: '🏢' },
    { value: 'remote', label: 'Remote Work', icon: '🏠' },
    { value: 'hybrid', label: 'Hybrid', icon: '🔄' },
    { value: 'freelance', label: 'Freelance', icon: '💼' },
    { value: 'student', label: 'Student', icon: '🎓' },
    { value: 'other', label: 'Other', icon: '✨' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account and work preferences</p>
        </div>
      </div>

      {/* Basic Profile Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Edit Profile
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          {isEditing && (
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData({ name: user?.name || '', email: user?.email || '' });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Work Preferences */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Briefcase className="w-6 h-6 text-purple-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Work Preferences</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Work Type</label>
            <select
              value={preferences.workType}
              onChange={(e) => setPreferences({ ...preferences, workType: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {workTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hours Per Day</label>
            <input
              type="number"
              min="1"
              max="24"
              value={preferences.workHoursPerDay}
              onChange={(e) => setPreferences({ ...preferences, workHoursPerDay: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Days Per Week</label>
            <input
              type="number"
              min="1"
              max="7"
              value={preferences.workDaysPerWeek}
              onChange={(e) => setPreferences({ ...preferences, workDaysPerWeek: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Break Duration (minutes)</label>
            <input
              type="number"
              min="0"
              max="240"
              step="15"
              value={preferences.breakDuration}
              onChange={(e) => setPreferences({ ...preferences, breakDuration: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Schedule Preferences */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Clock className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Schedule Preferences</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Work Start Time</label>
            <input
              type="time"
              value={preferences.workStartTime}
              onChange={(e) => setPreferences({ ...preferences, workStartTime: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Work End Time</label>
            <input
              type="time"
              value={preferences.workEndTime}
              onChange={(e) => setPreferences({ ...preferences, workEndTime: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Deep Work Preference</label>
            <select
              value={preferences.deepWorkPreference}
              onChange={(e) => setPreferences({ ...preferences, deepWorkPreference: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="morning">Morning (Best for focus)</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Task Duration (minutes)</label>
            <input
              type="number"
              min="15"
              max="240"
              step="15"
              value={preferences.preferredTaskDuration}
              onChange={(e) => setPreferences({ ...preferences, preferredTaskDuration: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Week Starts On</label>
            <select
              value={preferences.weekStartsOn}
              onChange={(e) => setPreferences({ ...preferences, weekStartsOn: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="monday">Monday</option>
              <option value="sunday">Sunday</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default Task View</label>
            <select
              value={preferences.defaultTaskView}
              onChange={(e) => setPreferences({ ...preferences, defaultTaskView: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="daily">Daily View</option>
              <option value="weekly">Weekly View</option>
              <option value="monthly">Monthly View</option>
            </select>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleSavePreferences}
            disabled={isSaving}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? 'Saving Preferences...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900">How these preferences are used</h3>
            <p className="text-sm text-blue-800 mt-1">
              Your work preferences help our AI generate personalized daily and weekly plans that match your schedule.
              The system will optimize task distribution based on your work hours, break times, and productivity patterns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
