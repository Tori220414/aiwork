import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Sparkles, Layers, Grid, Layout, Calendar, TrendingUp } from 'lucide-react';
import api from '../services/api';

interface Workspace {
  _id: string;
  id: string;
  name: string;
  description: string;
  default_view: string;
  theme: string;
  background_type: string;
  background_value: string;
  primary_color: string;
  secondary_color: string;
  workspace_type?: string;
  isPersonal?: boolean;
  memberRole?: string;
  memberJoinedAt?: string;
}

interface Template {
  _id: string;
  id: string;
  name: string;
  description: string;
  category: string;
  background_value: string;
  primary_color: string;
  is_ai_generated: boolean;
}

const Workspaces: React.FC = () => {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceType, setWorkspaceType] = useState<'personal' | 'team'>('personal');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [workspacesRes, templatesRes] = await Promise.all([
        api.get('/workspaces'),
        api.get('/workspaces/templates/list')
      ]);
      setWorkspaces(workspacesRes.data.workspaces || []);
      setTemplates(templatesRes.data.templates || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async (name: string, description: string, type: 'personal' | 'team') => {
    try {
      setCreating(true);
      await api.post('/workspaces', {
        name,
        description,
        default_view: 'kanban',
        theme: 'light',
        background_type: 'gradient',
        background_value: type === 'team'
          ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        primary_color: type === 'team' ? '#4facfe' : '#667eea',
        secondary_color: type === 'team' ? '#00f2fe' : '#764ba2',
        workspace_type: type
      });
      await fetchData();
      setShowCreateModal(false);
      setWorkspaceName('');
      setWorkspaceType('personal');
    } catch (error) {
      console.error('Error creating workspace:', error);
    } finally {
      setCreating(false);
    }
  };

  const createFromTemplate = async (templateId: string) => {
    try {
      setCreating(true);
      await api.post(`/workspaces/from-template/${templateId}`);
      await fetchData();
    } catch (error) {
      console.error('Error creating from template:', error);
    } finally {
      setCreating(false);
    }
  };

  const generateAIWorkspace = async () => {
    if (!aiPrompt.trim()) return;

    try {
      setCreating(true);
      await api.post('/workspaces/generate-and-create', {
        prompt: aiPrompt,
        workspaceName: workspaceName || undefined
      });
      await fetchData();
      setShowAIModal(false);
      setAiPrompt('');
      setWorkspaceName('');
    } catch (error) {
      console.error('Error generating AI workspace:', error);
      alert('Failed to generate workspace. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const getViewIcon = (view: string) => {
    switch (view) {
      case 'kanban': return <Grid className="w-4 h-4" />;
      case 'list': return <Layout className="w-4 h-4" />;
      case 'calendar': return <Calendar className="w-4 h-4" />;
      case 'timeline': return <TrendingUp className="w-4 h-4" />;
      default: return <Grid className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workspaces</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your workspaces and customize your workflow</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAIModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate with AI</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Workspace</span>
          </button>
        </div>
      </div>

      {/* Personal Workspaces */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Workspaces</h2>
        {workspaces.filter(w => w.isPersonal !== false && (!w.workspace_type || w.workspace_type === 'personal')).length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg mb-6">
            <p className="text-gray-500">No personal workspaces</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {workspaces
              .filter(w => w.isPersonal !== false && (!w.workspace_type || w.workspace_type === 'personal'))
              .map((workspace) => (
                <div
                  key={workspace._id || workspace.id}
                  onClick={() => navigate(`/workspaces/${workspace._id || workspace.id}`)}
                  className="bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer overflow-hidden"
                >
                  <div
                    className="h-32"
                    style={{
                      background: workspace.background_type === 'gradient'
                        ? workspace.background_value
                        : workspace.primary_color
                    }}
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{workspace.name}</h3>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{workspace.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        {getViewIcon(workspace.default_view)}
                        <span className="capitalize">{workspace.default_view}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: workspace.primary_color }}
                        />
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: workspace.secondary_color }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Team Workspaces */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Workspaces</h2>
        {workspaces.filter(w => w.workspace_type === 'team').length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No team workspaces yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces
              .filter(w => w.workspace_type === 'team')
              .map((workspace) => (
                <div
                  key={workspace._id || workspace.id}
                  onClick={() => navigate(`/workspaces/${workspace._id || workspace.id}`)}
                  className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer overflow-hidden"
                >
                  <div
                    className="h-32"
                    style={{
                      background: workspace.background_type === 'gradient'
                        ? workspace.background_value
                        : workspace.primary_color
                    }}
                  />
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900">{workspace.name}</h3>
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        Team
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{workspace.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        {getViewIcon(workspace.default_view)}
                        <span className="capitalize">{workspace.default_view}</span>
                      </div>
                      {workspace.memberRole && (
                        <span className="text-xs text-gray-500 capitalize">{workspace.memberRole}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Templates */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Workspace Templates</h2>
        {templates.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No templates available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template._id || template.id}
                className="bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all overflow-hidden"
              >
                <div
                  className="h-24"
                  style={{
                    background: template.background_value || template.primary_color
                  }}
                />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    {template.is_ai_generated && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{template.description}</p>
                  <button
                    onClick={() => createFromTemplate(template._id || template.id)}
                    disabled={creating}
                    className="w-full px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors disabled:opacity-50"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Workspace</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Workspace Name</label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="My Workspace"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Workspace Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setWorkspaceType('personal')}
                    className={`p-3 border-2 rounded-lg text-left transition-all ${
                      workspaceType === 'personal'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">Personal</div>
                    <div className="text-xs text-gray-500 mt-1">Just for you</div>
                  </button>
                  <button
                    onClick={() => setWorkspaceType('team')}
                    className={`p-3 border-2 rounded-lg text-left transition-all ${
                      workspaceType === 'team'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">Team</div>
                    <div className="text-xs text-gray-500 mt-1">Shared workspace</div>
                  </button>
                </div>
                {workspaceType === 'team' && (
                  <p className="text-xs text-gray-500 mt-2">
                    You can invite team members after creating the workspace
                  </p>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setWorkspaceName('');
                    setWorkspaceType('personal');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createWorkspace(workspaceName, '', workspaceType)}
                  disabled={!workspaceName.trim() || creating}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Generate Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Generate Workspace with AI</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Workspace Name (Optional)</label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Leave blank to let AI decide"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Describe Your Workspace</label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="E.g., Create a workspace for managing a software development team with sprint planning and bug tracking"
                />
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-xs text-purple-700">
                  💡 AI will generate a custom workspace with appropriate colors, board layouts, and sample tasks based on your description.
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowAIModal(false);
                    setAiPrompt('');
                    setWorkspaceName('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={generateAIWorkspace}
                  disabled={!aiPrompt.trim() || creating}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                >
                  {creating ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workspaces;
