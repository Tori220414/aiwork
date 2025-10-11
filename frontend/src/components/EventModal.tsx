import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Users, Link as LinkIcon, Save } from 'lucide-react';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: EventFormData) => void;
  initialDate?: Date;
  event?: any;
  workspaceId?: string;
}

export interface EventFormData {
  title: string;
  description: string;
  event_type: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  location: string;
  attendees: string[];
  meeting_link: string;
  color: string;
  workspace_id?: string;
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialDate,
  event,
  workspaceId
}) => {
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    event_type: 'event',
    start_time: '',
    end_time: '',
    all_day: false,
    location: '',
    attendees: [],
    meeting_link: '',
    color: '#3b82f6',
    workspace_id: workspaceId
  });

  const [attendeesInput, setAttendeesInput] = useState('');

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        event_type: event.event_type || 'event',
        start_time: event.start_time || '',
        end_time: event.end_time || '',
        all_day: event.all_day || false,
        location: event.location || '',
        attendees: event.attendees || [],
        meeting_link: event.meeting_link || '',
        color: event.color || '#3b82f6',
        workspace_id: event.workspace_id || workspaceId
      });
      setAttendeesInput((event.attendees || []).join(', '));
    } else if (initialDate) {
      const dateStr = initialDate.toISOString().slice(0, 16);
      setFormData(prev => ({
        ...prev,
        start_time: dateStr,
        end_time: dateStr,
        workspace_id: workspaceId
      }));
    }
  }, [event, initialDate, workspaceId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const attendeesArray = attendeesInput
      .split(',')
      .map(a => a.trim())
      .filter(a => a.length > 0);

    onSave({
      ...formData,
      attendees: attendeesArray
    });
  };

  const handleChange = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  const eventTypes = [
    { value: 'event', label: 'Event', color: '#3b82f6' },
    { value: 'meeting', label: 'Meeting', color: '#8b5cf6' },
    { value: 'deadline', label: 'Deadline', color: '#ef4444' },
    { value: 'reminder', label: 'Reminder', color: '#f59e0b' }
  ];

  const predefinedColors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444',
    '#f59e0b', '#10b981', '#06b6d4', '#6366f1'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {event ? 'Edit Event' : 'Create Event'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter event title"
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {eventTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    handleChange('event_type', type.value);
                    handleChange('color', type.color);
                  }}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    formData.event_type === type.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.start_time}
                onChange={(e) => handleChange('start_time', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                End Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => handleChange('end_time', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="all-day"
              checked={formData.all_day}
              onChange={(e) => handleChange('all_day', e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="all-day" className="ml-2 text-sm text-gray-700">
              All day event
            </label>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Add event description"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Add location"
            />
          </div>

          {/* Meeting Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <LinkIcon className="w-4 h-4 inline mr-1" />
              Meeting Link
            </label>
            <input
              type="url"
              value={formData.meeting_link}
              onChange={(e) => handleChange('meeting_link', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="https://zoom.us/j/..."
            />
          </div>

          {/* Attendees */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Attendees
            </label>
            <input
              type="text"
              value={attendeesInput}
              onChange={(e) => setAttendeesInput(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter names or emails, separated by commas"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate multiple attendees with commas
            </p>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Color
            </label>
            <div className="flex items-center space-x-2">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleChange('color', color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color
                      ? 'border-gray-900 scale-110'
                      : 'border-gray-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{event ? 'Update Event' : 'Create Event'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
