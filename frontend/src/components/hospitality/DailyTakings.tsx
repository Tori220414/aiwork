import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, DollarSign, TrendingUp, Download, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface ShiftTakings {
  shift: 'morning' | 'night';
  bar_sales: number;
  kitchen_sales: number;
  gaming_revenue: number;
  eftpos: number;
  cash: number;
  total: number;
  variance: number;
  notes?: string;
}

interface DayTakings {
  date: string;
  day_name: string;
  shifts: ShiftTakings[];
  daily_total: number;
  manager_on_duty: string;
}

interface WeeklyTakings {
  _id?: string;
  id?: string;
  workspace_id: string;
  week_starting: string;
  week_ending: string;
  days: DayTakings[];
  weekly_total: number;
  status: 'draft' | 'submitted' | 'approved';
  notes?: string;
  created_at?: string;
}

interface DailyTakingsProps {
  workspaceId: string;
}

const DailyTakings: React.FC<DailyTakingsProps> = ({ workspaceId }) => {
  const [takings, setTakings] = useState<WeeklyTakings[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTakings, setEditingTakings] = useState<WeeklyTakings | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  // Form state
  const [weekStarting, setWeekStarting] = useState('');
  const [weekEnding, setWeekEnding] = useState('');
  const [days, setDays] = useState<DayTakings[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchTakings();
  }, [workspaceId]);

  const fetchTakings = async () => {
    try {
      const response = await api.get(`/workspaces/${workspaceId}/daily-takings`);
      setTakings(response.data.takings || []);
    } catch (error: any) {
      console.error('Error fetching takings:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load takings');
      }
    } finally {
      setLoading(false);
    }
  };

  const initializeWeek = (startDate: string) => {
    const start = new Date(startDate);
    const weekDays: DayTakings[] = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      weekDays.push({
        date: dateStr,
        day_name: dayNames[date.getDay()],
        shifts: [
          {
            shift: 'morning',
            bar_sales: 0,
            kitchen_sales: 0,
            gaming_revenue: 0,
            eftpos: 0,
            cash: 0,
            total: 0,
            variance: 0,
            notes: ''
          },
          {
            shift: 'night',
            bar_sales: 0,
            kitchen_sales: 0,
            gaming_revenue: 0,
            eftpos: 0,
            cash: 0,
            total: 0,
            variance: 0,
            notes: ''
          }
        ],
        daily_total: 0,
        manager_on_duty: ''
      });
    }

    setDays(weekDays);

    // Auto-set week ending (6 days after start)
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    setWeekEnding(end.toISOString().split('T')[0]);
  };

  useEffect(() => {
    if (weekStarting && !editingTakings) {
      initializeWeek(weekStarting);
    }
  }, [weekStarting]);

  const calculateShiftTotal = (shift: ShiftTakings): number => {
    return shift.bar_sales + shift.kitchen_sales + shift.gaming_revenue;
  };

  const calculateVariance = (shift: ShiftTakings): number => {
    const expected = shift.eftpos + shift.cash;
    const actual = calculateShiftTotal(shift);
    return actual - expected;
  };

  const updateShift = (dayIndex: number, shiftIndex: number, field: keyof ShiftTakings, value: any) => {
    const newDays = [...days];
    const shift = { ...newDays[dayIndex].shifts[shiftIndex], [field]: value };

    // Auto-calculate total and variance
    shift.total = calculateShiftTotal(shift);
    shift.variance = calculateVariance(shift);

    newDays[dayIndex].shifts[shiftIndex] = shift;

    // Calculate daily total
    newDays[dayIndex].daily_total = newDays[dayIndex].shifts.reduce((sum, s) => sum + s.total, 0);

    setDays(newDays);
  };

  const updateDayManager = (dayIndex: number, manager: string) => {
    const newDays = [...days];
    newDays[dayIndex].manager_on_duty = manager;
    setDays(newDays);
  };

  const calculateWeeklyTotal = (): number => {
    return days.reduce((sum, day) => sum + day.daily_total, 0);
  };

  const toggleDay = (date: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDays(newExpanded);
  };

  const resetForm = () => {
    setEditingTakings(null);
    setWeekStarting('');
    setWeekEnding('');
    setDays([]);
    setNotes('');
    setShowForm(false);
    setExpandedDays(new Set());
  };

  const handleEdit = (taking: WeeklyTakings) => {
    setEditingTakings(taking);
    setWeekStarting(taking.week_starting.split('T')[0]);
    setWeekEnding(taking.week_ending.split('T')[0]);
    setDays(taking.days);
    setNotes(taking.notes || '');
    setShowForm(true);
    // Expand all days when editing
    setExpandedDays(new Set(taking.days.map(d => d.date)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!weekStarting || !weekEnding) {
      toast.error('Please fill in week dates');
      return;
    }

    const takingsData = {
      workspace_id: workspaceId,
      week_starting: weekStarting,
      week_ending: weekEnding,
      days,
      weekly_total: calculateWeeklyTotal(),
      status: 'draft' as const,
      notes
    };

    try {
      if (editingTakings) {
        await api.put(`/workspaces/${workspaceId}/daily-takings/${editingTakings._id || editingTakings.id}`, takingsData);
        toast.success('Takings updated successfully');
      } else {
        await api.post(`/workspaces/${workspaceId}/daily-takings`, takingsData);
        toast.success('Takings created successfully');
      }
      fetchTakings();
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save takings');
    }
  };

  const handleDelete = async (taking: WeeklyTakings) => {
    if (!window.confirm('Are you sure you want to delete this takings record?')) return;

    try {
      await api.delete(`/workspaces/${workspaceId}/daily-takings/${taking._id || taking.id}`);
      toast.success('Takings deleted successfully');
      fetchTakings();
    } catch (error: any) {
      toast.error('Failed to delete takings');
    }
  };

  const updateStatus = async (taking: WeeklyTakings, status: WeeklyTakings['status']) => {
    try {
      await api.put(`/workspaces/${workspaceId}/daily-takings/${taking._id || taking.id}`, {
        ...taking,
        status
      });
      toast.success('Status updated');
      fetchTakings();
    } catch (error: any) {
      toast.error('Failed to update status');
    }
  };

  const downloadTakings = (taking: WeeklyTakings) => {
    const csv = [
      ['Week Starting', taking.week_starting.split('T')[0]],
      ['Week Ending', taking.week_ending.split('T')[0]],
      ['Weekly Total', `$${taking.weekly_total.toFixed(2)}`],
      [''],
      ['Date', 'Day', 'Shift', 'Bar Sales', 'Kitchen Sales', 'Gaming', 'EFTPOS', 'Cash', 'Total', 'Variance', 'Manager'],
      ...taking.days.flatMap(day =>
        day.shifts.map(shift => [
          day.date,
          day.day_name,
          shift.shift.toUpperCase(),
          `$${shift.bar_sales.toFixed(2)}`,
          `$${shift.kitchen_sales.toFixed(2)}`,
          `$${shift.gaming_revenue.toFixed(2)}`,
          `$${shift.eftpos.toFixed(2)}`,
          `$${shift.cash.toFixed(2)}`,
          `$${shift.total.toFixed(2)}`,
          `$${shift.variance.toFixed(2)}`,
          day.manager_on_duty
        ])
      ),
      [''],
      ['Notes', taking.notes || '']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `takings-${taking.week_starting.split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success('Takings downloaded');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Daily Takings</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            New Week
          </button>
        )}
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Week Starting (Monday) *
              </label>
              <input
                type="date"
                value={weekStarting}
                onChange={(e) => setWeekStarting(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Week Ending (Sunday) *
              </label>
              <input
                type="date"
                value={weekEnding}
                onChange={(e) => setWeekEnding(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
                disabled
              />
            </div>
          </div>

          {/* Daily Sections */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Daily Breakdown</h3>
            {days.map((day, dayIndex) => (
              <div key={day.date} className="border border-gray-300 rounded-lg overflow-hidden">
                {/* Day Header */}
                <button
                  type="button"
                  onClick={() => toggleDay(day.date)}
                  className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-gray-900">{day.day_name}</span>
                    <span className="text-sm text-gray-600">{new Date(day.date).toLocaleDateString()}</span>
                    <span className="text-sm font-medium text-green-600">
                      Total: ${day.daily_total.toFixed(2)}
                    </span>
                  </div>
                  {expandedDays.has(day.date) ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>

                {/* Day Content */}
                {expandedDays.has(day.date) && (
                  <div className="p-4 space-y-4">
                    {/* Manager */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Manager on Duty
                      </label>
                      <input
                        type="text"
                        value={day.manager_on_duty}
                        onChange={(e) => updateDayManager(dayIndex, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Manager name"
                      />
                    </div>

                    {/* Shifts */}
                    {day.shifts.map((shift, shiftIndex) => (
                      <div key={shift.shift} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h4 className="font-medium text-gray-900 mb-3 capitalize">{shift.shift} Shift</h4>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Bar Sales</label>
                            <input
                              type="number"
                              value={shift.bar_sales}
                              onChange={(e) => updateShift(dayIndex, shiftIndex, 'bar_sales', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Kitchen Sales</label>
                            <input
                              type="number"
                              value={shift.kitchen_sales}
                              onChange={(e) => updateShift(dayIndex, shiftIndex, 'kitchen_sales', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Gaming Revenue</label>
                            <input
                              type="number"
                              value={shift.gaming_revenue}
                              onChange={(e) => updateShift(dayIndex, shiftIndex, 'gaming_revenue', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Total</label>
                            <div className="px-3 py-2 bg-white border border-gray-300 rounded-lg font-medium">
                              ${shift.total.toFixed(2)}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">EFTPOS</label>
                            <input
                              type="number"
                              value={shift.eftpos}
                              onChange={(e) => updateShift(dayIndex, shiftIndex, 'eftpos', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Cash</label>
                            <input
                              type="number"
                              value={shift.cash}
                              onChange={(e) => updateShift(dayIndex, shiftIndex, 'cash', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Variance</label>
                            <div className={`px-3 py-2 border rounded-lg font-medium ${
                              shift.variance === 0 ? 'bg-green-50 border-green-300 text-green-700' :
                              shift.variance > 0 ? 'bg-yellow-50 border-yellow-300 text-yellow-700' :
                              'bg-red-50 border-red-300 text-red-700'
                            }`}>
                              ${shift.variance.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Shift Notes</label>
                          <input
                            type="text"
                            value={shift.notes}
                            onChange={(e) => updateShift(dayIndex, shiftIndex, 'notes', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Any issues or notes..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Weekly Total */}
          <div className="border-t pt-4">
            <div className="flex justify-end">
              <span className="text-2xl font-bold text-green-600">
                Weekly Total: ${calculateWeeklyTotal().toFixed(2)}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Week Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Any notes for the week..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              {editingTakings ? 'Update Takings' : 'Save Takings'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {takings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No takings recorded yet</p>
              <p className="text-sm text-gray-500">Click "New Week" to start recording daily takings</p>
            </div>
          ) : (
            takings.map((taking) => (
              <div key={taking._id || taking.id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Week: {new Date(taking.week_starting).toLocaleDateString()} - {new Date(taking.week_ending).toLocaleDateString()}
                      </h3>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(taking.status)}`}>
                        {taking.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      <TrendingUp className="w-5 h-5 inline mr-2" />
                      ${taking.weekly_total.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadTakings(taking)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Download Takings"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(taking)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Edit Takings"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(taking)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete Takings"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Daily Summary Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Day</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Bar</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Kitchen</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Gaming</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Daily Total</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Manager</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {taking.days.map((day) => {
                        const barTotal = day.shifts.reduce((sum, s) => sum + s.bar_sales, 0);
                        const kitchenTotal = day.shifts.reduce((sum, s) => sum + s.kitchen_sales, 0);
                        const gamingTotal = day.shifts.reduce((sum, s) => sum + s.gaming_revenue, 0);

                        return (
                          <tr key={day.date} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm font-medium">{day.day_name}</td>
                            <td className="px-4 py-2 text-sm">${barTotal.toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm">${kitchenTotal.toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm">${gamingTotal.toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm font-bold text-green-600">${day.daily_total.toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm">{day.manager_on_duty}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex gap-2 flex-wrap">
                    {taking.status === 'draft' && (
                      <button
                        onClick={() => updateStatus(taking, 'submitted')}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Submit for Approval
                      </button>
                    )}
                    {taking.status === 'submitted' && (
                      <button
                        onClick={() => updateStatus(taking, 'approved')}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default DailyTakings;
