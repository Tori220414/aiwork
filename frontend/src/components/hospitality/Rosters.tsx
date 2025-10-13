import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, Clock, Users, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface Shift {
  staff_name: string;
  position: string;
  date: string;
  start_time: string;
  end_time: string;
  hours: number;
  notes?: string;
}

interface Roster {
  _id?: string;
  id?: string;
  workspace_id: string;
  week_starting: string;
  week_ending: string;
  shifts: Shift[];
  status: 'draft' | 'published' | 'completed';
  notes?: string;
  created_at?: string;
}

interface RostersProps {
  workspaceId: string;
}

const Rosters: React.FC<RostersProps> = ({ workspaceId }) => {
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoster, setEditingRoster] = useState<Roster | null>(null);

  // Form state
  const [weekStarting, setWeekStarting] = useState('');
  const [weekEnding, setWeekEnding] = useState('');
  const [shifts, setShifts] = useState<Shift[]>([{
    staff_name: '',
    position: 'Bartender',
    date: '',
    start_time: '09:00',
    end_time: '17:00',
    hours: 8,
    notes: ''
  }]);
  const [notes, setNotes] = useState('');

  const positions = ['Bartender', 'Floor Staff', 'Kitchen', 'Manager', 'Security', 'Cleaner', 'Chef', 'Wait Staff'];

  useEffect(() => {
    fetchRosters();
  }, [workspaceId]);

  const fetchRosters = async () => {
    try {
      const response = await api.get(`/workspaces/${workspaceId}/rosters`);
      setRosters(response.data.rosters || []);
    } catch (error: any) {
      console.error('Error fetching rosters:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load rosters');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateHours = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let hours = endHour - startHour;
    let minutes = endMin - startMin;

    if (minutes < 0) {
      hours -= 1;
      minutes += 60;
    }

    return hours + (minutes / 60);
  };

  const handleShiftChange = (index: number, field: keyof Shift, value: any) => {
    const newShifts = [...shifts];
    newShifts[index] = { ...newShifts[index], [field]: value };

    // Auto-calculate hours when times change
    if (field === 'start_time' || field === 'end_time') {
      const hours = calculateHours(newShifts[index].start_time, newShifts[index].end_time);
      newShifts[index].hours = Math.max(0, hours);
    }

    setShifts(newShifts);
  };

  const addShift = () => {
    setShifts([...shifts, {
      staff_name: '',
      position: 'Bartender',
      date: '',
      start_time: '09:00',
      end_time: '17:00',
      hours: 8,
      notes: ''
    }]);
  };

  const removeShift = (index: number) => {
    if (shifts.length > 1) {
      setShifts(shifts.filter((_, i) => i !== index));
    }
  };

  const resetForm = () => {
    setEditingRoster(null);
    setWeekStarting('');
    setWeekEnding('');
    setShifts([{
      staff_name: '',
      position: 'Bartender',
      date: '',
      start_time: '09:00',
      end_time: '17:00',
      hours: 8,
      notes: ''
    }]);
    setNotes('');
    setShowForm(false);
  };

  const handleEdit = (roster: Roster) => {
    setEditingRoster(roster);
    setWeekStarting(roster.week_starting.split('T')[0]);
    setWeekEnding(roster.week_ending.split('T')[0]);
    setShifts(roster.shifts);
    setNotes(roster.notes || '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!weekStarting || !weekEnding) {
      toast.error('Please fill in week dates');
      return;
    }

    const rosterData = {
      workspace_id: workspaceId,
      week_starting: weekStarting,
      week_ending: weekEnding,
      shifts,
      status: 'draft' as const,
      notes
    };

    try {
      if (editingRoster) {
        await api.put(`/workspaces/${workspaceId}/rosters/${editingRoster._id || editingRoster.id}`, rosterData);
        toast.success('Roster updated successfully');
      } else {
        await api.post(`/workspaces/${workspaceId}/rosters`, rosterData);
        toast.success('Roster created successfully');
      }
      fetchRosters();
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save roster');
    }
  };

  const handleDelete = async (roster: Roster) => {
    if (!window.confirm('Are you sure you want to delete this roster?')) return;

    try {
      await api.delete(`/workspaces/${workspaceId}/rosters/${roster._id || roster.id}`);
      toast.success('Roster deleted successfully');
      fetchRosters();
    } catch (error: any) {
      toast.error('Failed to delete roster');
    }
  };

  const updateStatus = async (roster: Roster, status: Roster['status']) => {
    try {
      await api.put(`/workspaces/${workspaceId}/rosters/${roster._id || roster.id}`, {
        ...roster,
        status
      });
      toast.success('Roster status updated');
      fetchRosters();
    } catch (error: any) {
      toast.error('Failed to update status');
    }
  };

  const downloadRoster = (roster: Roster) => {
    const csv = [
      ['Week Starting', roster.week_starting.split('T')[0]],
      ['Week Ending', roster.week_ending.split('T')[0]],
      ['Status', roster.status.toUpperCase()],
      [''],
      ['Staff Name', 'Position', 'Date', 'Start Time', 'End Time', 'Hours', 'Notes'],
      ...roster.shifts.map(shift => [
        shift.staff_name,
        shift.position,
        shift.date,
        shift.start_time,
        shift.end_time,
        shift.hours.toFixed(2),
        shift.notes || ''
      ]),
      [''],
      ['Total Hours', '', '', '', '', roster.shifts.reduce((sum, s) => sum + s.hours, 0).toFixed(2), ''],
      [''],
      ['Notes', roster.notes || '']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `roster-${roster.week_starting.split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success('Roster downloaded');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'published': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
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
        <h2 className="text-2xl font-bold text-gray-900">Staff Rosters</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            New Roster
          </button>
        )}
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Week Starting *
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
                Week Ending *
              </label>
              <input
                type="date"
                value={weekEnding}
                onChange={(e) => setWeekEnding(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          {/* Shifts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shifts</label>
            <div className="space-y-2">
              {shifts.map((shift, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    value={shift.staff_name}
                    onChange={(e) => handleShiftChange(index, 'staff_name', e.target.value)}
                    className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Staff name"
                  />
                  <select
                    value={shift.position}
                    onChange={(e) => handleShiftChange(index, 'position', e.target.value)}
                    className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {positions.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={shift.date}
                    onChange={(e) => handleShiftChange(index, 'date', e.target.value)}
                    className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="time"
                    value={shift.start_time}
                    onChange={(e) => handleShiftChange(index, 'start_time', e.target.value)}
                    className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="time"
                    value={shift.end_time}
                    onChange={(e) => handleShiftChange(index, 'end_time', e.target.value)}
                    className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <div className="col-span-1 px-3 py-2 bg-white border border-gray-300 rounded-lg flex items-center text-sm">
                    {shift.hours.toFixed(1)}h
                  </div>
                  <button
                    type="button"
                    onClick={() => removeShift(index)}
                    className="col-span-1 p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    disabled={shifts.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addShift}
              className="mt-2 text-sm text-primary-600 hover:text-primary-700"
            >
              + Add Shift
            </button>
          </div>

          {/* Total Hours */}
          <div className="border-t pt-4">
            <div className="flex justify-end">
              <span className="text-lg font-bold">
                Total Hours: {shifts.reduce((sum, s) => sum + s.hours, 0).toFixed(1)}h
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Additional notes..."
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
              {editingRoster ? 'Update Roster' : 'Create Roster'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {rosters.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No rosters yet</p>
              <p className="text-sm text-gray-500">Click "New Roster" to create your first roster</p>
            </div>
          ) : (
            rosters.map((roster) => (
              <div key={roster._id || roster.id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Week: {new Date(roster.week_starting).toLocaleDateString()} - {new Date(roster.week_ending).toLocaleDateString()}
                      </h3>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(roster.status)}`}>
                        {roster.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      <Users className="w-4 h-4 inline mr-1" />
                      {roster.shifts.length} shifts · {roster.shifts.reduce((sum, s) => sum + s.hours, 0).toFixed(1)} total hours
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadRoster(roster)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Download Roster"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(roster)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Edit Roster"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(roster)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete Roster"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Shifts Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Staff</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Position</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Time</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {roster.shifts.map((shift, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm">{shift.staff_name}</td>
                          <td className="px-4 py-2 text-sm">{shift.position}</td>
                          <td className="px-4 py-2 text-sm">{new Date(shift.date).toLocaleDateString()}</td>
                          <td className="px-4 py-2 text-sm">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {shift.start_time} - {shift.end_time}
                          </td>
                          <td className="px-4 py-2 text-sm font-medium">{shift.hours.toFixed(1)}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex gap-2 flex-wrap">
                    {roster.status === 'draft' && (
                      <button
                        onClick={() => updateStatus(roster, 'published')}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Publish Roster
                      </button>
                    )}
                    {roster.status === 'published' && (
                      <button
                        onClick={() => updateStatus(roster, 'completed')}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Mark as Completed
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

export default Rosters;
