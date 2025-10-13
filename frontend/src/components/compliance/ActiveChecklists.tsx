import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Circle, Clock, AlertCircle, Users, Calendar, MessageSquare, Download, Eye, Trash2, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface ChecklistItem {
  id: string;
  text: string;
  required: boolean;
  notes: string;
  completed: boolean;
  completedAt: string | null;
  completedBy: string | null;
  comments?: Comment[];
}

interface Comment {
  id: string;
  user: string;
  text: string;
  createdAt: string;
}

interface ChecklistInstance {
  id: string;
  template_id?: string;
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

interface Template {
  id: string;
  name: string;
  industry: string;
  category?: string;
  items: ChecklistItem[];
}

interface ActiveChecklistsProps {
  workspaceId: string;
}

const ActiveChecklists: React.FC<ActiveChecklistsProps> = ({ workspaceId }) => {
  const [instances, setInstances] = useState<ChecklistInstance[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingInstance, setViewingInstance] = useState<ChecklistInstance | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [checklistName, setChecklistName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [commentText, setCommentText] = useState('');
  const [commentingItemId, setCommentingItemId] = useState<string | null>(null);

  useEffect(() => {
    fetchInstances();
    fetchTemplates();
  }, [workspaceId]);

  const fetchInstances = async () => {
    try {
      const response = await api.get(`/workspaces/${workspaceId}/instances`);
      setInstances(response.data.instances || []);
    } catch (error: any) {
      console.error('Error fetching instances:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load active checklists');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.get(`/workspaces/${workspaceId}/templates`);
      setTemplates(response.data.templates || []);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleCreateInstance = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template');
      return;
    }

    try {
      await api.post(`/workspaces/${workspaceId}/instances/from-template/${selectedTemplate}`, {
        name: checklistName,
        dueDate: dueDate || null,
        assignedTo: assignedTo || null
      });
      toast.success('Active checklist created successfully');
      fetchInstances();
      resetCreateForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create checklist');
    }
  };

  const resetCreateForm = () => {
    setShowCreateModal(false);
    setSelectedTemplate('');
    setChecklistName('');
    setDueDate('');
    setAssignedTo('');
  };

  const toggleItemComplete = async (instance: ChecklistInstance, itemId: string) => {
    const updatedItems = instance.items.map(item =>
      item.id === itemId
        ? {
            ...item,
            completed: !item.completed,
            completedAt: !item.completed ? new Date().toISOString() : null,
            completedBy: !item.completed ? 'Current User' : null
          }
        : item
    );

    try {
      await api.put(`/workspaces/${workspaceId}/instances/${instance.id}`, {
        ...instance,
        items: updatedItems
      });
      fetchInstances();
      if (viewingInstance && viewingInstance.id === instance.id) {
        setViewingInstance({ ...instance, items: updatedItems });
      }
    } catch (error: any) {
      toast.error('Failed to update checklist');
    }
  };

  const addComment = async (instance: ChecklistInstance, itemId: string) => {
    if (!commentText.trim()) return;

    const updatedItems = instance.items.map(item => {
      if (item.id === itemId) {
        const newComment: Comment = {
          id: `comment-${Date.now()}`,
          user: 'Current User',
          text: commentText,
          createdAt: new Date().toISOString()
        };
        return {
          ...item,
          comments: [...(item.comments || []), newComment]
        };
      }
      return item;
    });

    try {
      await api.put(`/workspaces/${workspaceId}/instances/${instance.id}`, {
        ...instance,
        items: updatedItems
      });
      setCommentText('');
      setCommentingItemId(null);
      fetchInstances();
      if (viewingInstance && viewingInstance.id === instance.id) {
        setViewingInstance({ ...instance, items: updatedItems });
      }
      toast.success('Comment added');
    } catch (error: any) {
      toast.error('Failed to add comment');
    }
  };

  const deleteInstance = async (instanceId: string) => {
    if (!window.confirm('Are you sure you want to delete this checklist?')) return;

    try {
      await api.delete(`/workspaces/${workspaceId}/instances/${instanceId}`);
      toast.success('Checklist deleted');
      fetchInstances();
      if (viewingInstance && viewingInstance.id === instanceId) {
        setViewingInstance(null);
      }
    } catch (error: any) {
      toast.error('Failed to delete checklist');
    }
  };

  const downloadChecklist = (instance: ChecklistInstance) => {
    const csv = [
      ['Checklist Name', instance.name],
      ['Industry', instance.industry],
      ['Status', instance.status.toUpperCase()],
      ['Due Date', instance.due_date ? new Date(instance.due_date).toLocaleDateString() : 'Not set'],
      ['Assigned To', instance.assigned_to || 'Unassigned'],
      [''],
      ['Item', 'Status', 'Required', 'Notes', 'Completed At', 'Completed By'],
      ...instance.items.map(item => [
        item.text,
        item.completed ? 'COMPLETED' : 'PENDING',
        item.required ? 'Yes' : 'No',
        item.notes || '',
        item.completedAt ? new Date(item.completedAt).toLocaleString() : '',
        item.completedBy || ''
      ]),
      [''],
      ['Completion', `${getCompletionPercentage(instance).toFixed(0)}%`]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `checklist-${instance.name.replace(/\s+/g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success('Checklist downloaded');
  };

  const getCompletionPercentage = (instance: ChecklistInstance) => {
    if (instance.items.length === 0) return 0;
    return (instance.items.filter(item => item.completed).length / instance.items.length) * 100;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const isOverdue = (instance: ChecklistInstance) => {
    if (!instance.due_date || instance.status === 'completed') return false;
    return new Date(instance.due_date) < new Date();
  };

  const filteredInstances = instances
    .map(instance => ({
      ...instance,
      status: isOverdue(instance) ? 'overdue' as const : instance.status
    }))
    .filter(instance => {
      if (filterStatus === 'all') return true;
      return instance.status === filterStatus;
    });

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
          <h2 className="text-2xl font-bold text-gray-900">Active Checklists</h2>
          <p className="text-sm text-gray-500 mt-1">{instances.length} total checklists</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          New Checklist
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white rounded-lg shadow-md p-4">
        <Filter className="w-4 h-4 text-gray-500" />
        <div className="flex gap-2">
          {['all', 'in_progress', 'completed', 'overdue'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filterStatus === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
        <span className="ml-auto text-sm text-gray-500">
          {filteredInstances.length} checklist{filteredInstances.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Checklists Grid */}
      {filteredInstances.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <CheckCircle2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">
            {instances.length === 0 ? 'No active checklists yet' : 'No checklists match your filter'}
          </p>
          <p className="text-sm text-gray-500">
            {instances.length === 0 ? 'Create a checklist from a template to get started' : 'Try adjusting your filter'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInstances.map((instance) => {
            const completionPercentage = getCompletionPercentage(instance);
            return (
              <div
                key={instance.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {instance.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(instance.status)}`}>
                        {getStatusIcon(instance.status)}
                        {instance.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                        {instance.industry}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold text-primary-600">{completionPercentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        completionPercentage === 100 ? 'bg-green-600' : 'bg-primary-600'
                      }`}
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  {instance.due_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className={`${isOverdue(instance) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                        Due: {new Date(instance.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {instance.assigned_to && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4 text-gray-400" />
                      Assigned to: {instance.assigned_to}
                    </div>
                  )}
                  <div className="text-sm text-gray-500">
                    {instance.items.filter(i => i.completed).length} / {instance.items.length} items completed
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewingInstance(instance)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => downloadChecklist(instance)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteInstance(instance.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Create Active Checklist
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Template *
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => {
                    setSelectedTemplate(e.target.value);
                    const template = templates.find(t => t.id === e.target.value);
                    if (template && !checklistName) {
                      setChecklistName(template.name);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Choose a template...</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.industry})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Checklist Name
                </label>
                <input
                  type="text"
                  value={checklistName}
                  onChange={(e) => setChecklistName(e.target.value)}
                  placeholder="Leave blank to use template name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To
                </label>
                <input
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="Team member name or email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={resetCreateForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateInstance}
                  disabled={!selectedTemplate}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Checklist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View/Edit Modal */}
      {viewingInstance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {viewingInstance.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(viewingInstance.status)}`}>
                      {getStatusIcon(viewingInstance.status)}
                      {viewingInstance.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                      {viewingInstance.industry}
                    </span>
                    {viewingInstance.category && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {viewingInstance.category}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setViewingInstance(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Overall Progress</span>
                  <span className="font-semibold text-primary-600">
                    {getCompletionPercentage(viewingInstance).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      getCompletionPercentage(viewingInstance) === 100 ? 'bg-green-600' : 'bg-primary-600'
                    }`}
                    style={{ width: `${getCompletionPercentage(viewingInstance)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {viewingInstance.items.map((item, index) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      item.completed
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleItemComplete(viewingInstance, item.id)}
                        className="mt-1 flex-shrink-0"
                      >
                        {item.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className={`text-sm font-medium ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {index + 1}. {item.text}
                          </p>
                          {item.required && (
                            <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full flex-shrink-0">
                              Required
                            </span>
                          )}
                        </div>

                        {item.notes && (
                          <p className="text-xs text-gray-500 mb-2">{item.notes}</p>
                        )}

                        {item.completed && item.completedAt && (
                          <p className="text-xs text-green-600">
                            Completed {new Date(item.completedAt).toLocaleString()}
                            {item.completedBy && ` by ${item.completedBy}`}
                          </p>
                        )}

                        {/* Comments */}
                        {item.comments && item.comments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {item.comments.map(comment => (
                              <div key={comment.id} className="bg-gray-50 rounded p-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium text-gray-900">{comment.user}</span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(comment.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-700">{comment.text}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Comment */}
                        {commentingItemId === item.id ? (
                          <div className="mt-3 flex gap-2">
                            <input
                              type="text"
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder="Add a comment..."
                              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  addComment(viewingInstance, item.id);
                                }
                              }}
                            />
                            <button
                              onClick={() => addComment(viewingInstance, item.id)}
                              className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                            >
                              Post
                            </button>
                            <button
                              onClick={() => {
                                setCommentingItemId(null);
                                setCommentText('');
                              }}
                              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setCommentingItemId(item.id)}
                            className="mt-2 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                          >
                            <MessageSquare className="w-3 h-3" />
                            Add comment
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => downloadChecklist(viewingInstance)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-white"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => setViewingInstance(null)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function X(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}

export default ActiveChecklists;
