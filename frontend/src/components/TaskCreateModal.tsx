import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Tag, AlertCircle, Sparkles } from 'lucide-react';
import { parseNaturalLanguageDate, commonDateSuggestions, extractDateFromTitle } from '../utils/dateParser';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: any) => Promise<void>;
}

const TaskCreateModal: React.FC<TaskCreateModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [category, setCategory] = useState('work');
  const [dueDate, setDueDate] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(30);
  const [tags, setTags] = useState('');

  const [naturalDateInput, setNaturalDateInput] = useState('');
  const [parsedDate, setParsedDate] = useState<Date | null>(null);
  const [showDateSuggestions, setShowDateSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-extract date from title
  useEffect(() => {
    if (title.length > 3) {
      const { cleanTitle, date } = extractDateFromTitle(title);
      if (date && !parsedDate) {
        setTitle(cleanTitle);
        setParsedDate(date);
        setDueDate(format(date, "yyyy-MM-dd'T'HH:mm"));
        toast.success(`Auto-detected date: ${format(date, 'PPP p')}`, { duration: 2000 });
      }
    }
  }, [title]);

  // Parse natural language date input
  useEffect(() => {
    if (naturalDateInput.trim()) {
      const parsed = parseNaturalLanguageDate(naturalDateInput);
      if (parsed) {
        setParsedDate(parsed.date);
        setDueDate(format(parsed.date, "yyyy-MM-dd'T'HH:mm"));
      } else {
        setParsedDate(null);
      }
    }
  }, [naturalDateInput]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    setIsSubmitting(true);
    try {
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        priority,
        category,
        dueDate: dueDate || undefined,
        estimatedTime,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        status: 'pending'
      };

      await onSubmit(taskData);

      // Reset form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setCategory('work');
      setDueDate('');
      setEstimatedTime(30);
      setTags('');
      setNaturalDateInput('');
      setParsedDate(null);

      toast.success('Task created successfully!');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateSuggestionClick = (suggestion: string) => {
    setNaturalDateInput(suggestion);
    setShowDateSuggestions(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Create New Task</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Review project proposal tomorrow at 2pm"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Tip: Include dates in your title like "tomorrow", "next Monday", or "Friday at 3pm"
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details about this task..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Natural Language Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Sparkles className="w-4 h-4 inline mr-1" />
              Due Date (Natural Language)
            </label>
            <div className="relative">
              <input
                type="text"
                value={naturalDateInput}
                onChange={(e) => setNaturalDateInput(e.target.value)}
                onFocus={() => setShowDateSuggestions(true)}
                placeholder="e.g., tomorrow at 3pm, next Monday, in 2 weeks"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {parsedDate && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
                  <Calendar className="w-4 h-4 text-green-600 mr-2" />
                  <span className="text-sm text-green-800">
                    {format(parsedDate, 'PPP p')}
                  </span>
                </div>
              )}

              {showDateSuggestions && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-2">
                    <p className="text-xs text-gray-500 mb-2 px-2">Quick suggestions:</p>
                    <div className="space-y-1">
                      {commonDateSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleDateSuggestionClick(suggestion)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Manual Date/Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or Set Specific Date & Time
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                setNaturalDateInput('');
                setParsedDate(null);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="meeting">Meeting</option>
                <option value="email">Email</option>
                <option value="planning">Planning</option>
                <option value="learning">Learning</option>
                <option value="health">Health</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Estimated Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Estimated Time (minutes)
            </label>
            <input
              type="number"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(parseInt(e.target.value) || 0)}
              min="5"
              step="5"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., urgent, client-work, q1-goals"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskCreateModal;
