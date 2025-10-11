import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  Link as LinkIcon,
  FileText,
  CheckSquare,
  Plus,
  Trash2,
  Edit,
  Sparkles
} from 'lucide-react';
import api from '../services/api';
import MeetingPrepDisplay from './MeetingPrepDisplay';

interface Event {
  _id: string;
  id: string;
  title: string;
  description?: string;
  event_type: string;
  start_time: string;
  end_time?: string;
  all_day: boolean;
  color?: string;
  location?: string;
  attendees?: string[];
  meeting_link?: string;
  status?: string;
}

interface MeetingNote {
  _id: string;
  id: string;
  content: string;
  notes_type: string;
  ai_generated?: boolean;
  ai_summary?: string;
  created_at: string;
}

interface ActionItem {
  _id: string;
  id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  due_date?: string;
  status: string;
  priority: string;
  created_at: string;
}

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onEdit: () => void;
  onDelete: () => void;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({
  isOpen,
  onClose,
  eventId,
  onEdit,
  onDelete
}) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'notes' | 'actions'>('details');

  // Forms
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [newActionItem, setNewActionItem] = useState({
    title: '',
    description: '',
    assigned_to: '',
    due_date: '',
    priority: 'medium'
  });
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showActionForm, setShowActionForm] = useState(false);
  const [generatingPrep, setGeneratingPrep] = useState(false);

  useEffect(() => {
    if (isOpen && eventId) {
      fetchEventDetails();
    }
  }, [isOpen, eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${eventId}`);
      setEvent(response.data);
      setNotes(response.data.notes || []);
      setActionItems(response.data.actionItems || []);
    } catch (error) {
      console.error('Error fetching event details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/events/${eventId}/notes`, {
        content: newNote,
        notes_type: noteType
      });
      setNewNote('');
      setNoteType('general');
      setShowNoteForm(false);
      await fetchEventDetails();
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleAddActionItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/events/${eventId}/action-items`, newActionItem);
      setNewActionItem({
        title: '',
        description: '',
        assigned_to: '',
        due_date: '',
        priority: 'medium'
      });
      setShowActionForm(false);
      await fetchEventDetails();
    } catch (error) {
      console.error('Error adding action item:', error);
    }
  };

  const handleGenerateMeetingPrep = async () => {
    try {
      setGeneratingPrep(true);
      const response = await api.post(`/events/${eventId}/generate-prep`);
      await fetchEventDetails();
    } catch (error) {
      console.error('Error generating meeting prep:', error);
    } finally {
      setGeneratingPrep(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <p className="text-gray-600">Event not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div
          className="p-6 text-white"
          style={{ backgroundColor: event.color || '#3b82f6' }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="text-sm opacity-90 mb-1">
                {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
              </div>
              <h2 className="text-2xl font-bold">{event.title}</h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onEdit}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="Edit event"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="Delete event"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Event Info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDateTime(event.start_time)}</span>
              {event.end_time && (
                <>
                  <span>-</span>
                  <Clock className="w-4 h-4" />
                  <span>{formatDateTime(event.end_time)}</span>
                </>
              )}
            </div>
            {event.location && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
            )}
            {event.attendees && event.attendees.length > 0 && (
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>{event.attendees.join(', ')}</span>
              </div>
            )}
            {event.meeting_link && (
              <div className="flex items-center space-x-2">
                <LinkIcon className="w-4 h-4" />
                <a
                  href={event.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-80"
                >
                  Join Meeting
                </a>
              </div>
            )}
          </div>

          {event.description && (
            <p className="mt-4 opacity-90">{event.description}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Details
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'notes'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Notes ({notes.length})
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'actions'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <CheckSquare className="w-4 h-4 inline mr-2" />
            Action Items ({actionItems.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {event.event_type === 'meeting' && (
                <button
                  onClick={handleGenerateMeetingPrep}
                  disabled={generatingPrep}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>{generatingPrep ? 'Generating...' : 'Generate AI Meeting Prep'}</span>
                </button>
              )}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Event Status</h3>
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                  event.status === 'completed' ? 'bg-green-100 text-green-700' :
                  event.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                  event.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {event.status || 'scheduled'}
                </span>
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <button
                onClick={() => setShowNoteForm(!showNoteForm)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Note</span>
              </button>

              {showNoteForm && (
                <form onSubmit={handleAddNote} className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <select
                      value={noteType}
                      onChange={(e) => setNoteType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="general">General Notes</option>
                      <option value="agenda">Agenda</option>
                      <option value="action-items">Action Items</option>
                      <option value="decisions">Decisions</option>
                    </select>
                  </div>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter your notes..."
                    rows={4}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Save Note
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNoteForm(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {notes.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No notes yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note._id || note.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {note.notes_type}
                        </span>
                        <span className="text-xs text-gray-500">{formatDate(note.created_at)}</span>
                      </div>
                      {note.ai_generated && (
                        <div className="flex items-center space-x-1 mb-2">
                          <Sparkles className="w-3 h-3 text-purple-600" />
                          <span className="text-xs text-purple-600">AI Generated Meeting Prep</span>
                        </div>
                      )}
                      {note.ai_generated && note.notes_type === 'agenda' ? (
                        <MeetingPrepDisplay prepData={note.content} />
                      ) : (
                        <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Items Tab */}
          {activeTab === 'actions' && (
            <div className="space-y-4">
              <button
                onClick={() => setShowActionForm(!showActionForm)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Action Item</span>
              </button>

              {showActionForm && (
                <form onSubmit={handleAddActionItem} className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <input
                    type="text"
                    value={newActionItem.title}
                    onChange={(e) => setNewActionItem({ ...newActionItem, title: e.target.value })}
                    placeholder="Action item title"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <textarea
                    value={newActionItem.description}
                    onChange={(e) => setNewActionItem({ ...newActionItem, description: e.target.value })}
                    placeholder="Description"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={newActionItem.assigned_to}
                      onChange={(e) => setNewActionItem({ ...newActionItem, assigned_to: e.target.value })}
                      placeholder="Assigned to"
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="date"
                      value={newActionItem.due_date}
                      onChange={(e) => setNewActionItem({ ...newActionItem, due_date: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <select
                    value={newActionItem.priority}
                    onChange={(e) => setNewActionItem({ ...newActionItem, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Add Action Item
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowActionForm(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {actionItems.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No action items yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {actionItems.map((item) => (
                    <div key={item._id || item.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${
                          item.status === 'completed' ? 'bg-green-100 text-green-700' :
                          item.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-3">
                          {item.assigned_to && (
                            <span>Assigned to: {item.assigned_to}</span>
                          )}
                          <span className={`px-2 py-1 rounded ${
                            item.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                            item.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                            item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {item.priority}
                          </span>
                        </div>
                        {item.due_date && (
                          <span>Due: {formatDate(item.due_date)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;
