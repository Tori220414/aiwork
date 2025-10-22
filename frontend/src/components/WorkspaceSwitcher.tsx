import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Layers } from 'lucide-react';
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

interface WorkspaceSwitcherProps {
  onWorkspaceChange?: (workspaceId: string) => void;
  onCreateNew?: () => void;
}

const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  onWorkspaceChange,
  onCreateNew
}) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const response = await api.get('/workspaces');
      const workspacesList = response.data.workspaces || [];
      setWorkspaces(workspacesList);

      // Set first workspace as current or find default
      const defaultWorkspace = workspacesList.find((w: Workspace) => w.default_view) || workspacesList[0];
      if (defaultWorkspace) {
        setCurrentWorkspace(defaultWorkspace);
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkspaceSelect = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    setIsOpen(false);
    if (onWorkspaceChange) {
      onWorkspaceChange(workspace._id || workspace.id);
    }
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    if (onCreateNew) {
      onCreateNew();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <Layers className="w-5 h-5 text-gray-400" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Layers className="w-5 h-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-900">
          {currentWorkspace?.name || 'Select Workspace'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-2 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase px-2 py-1">
                Workspaces
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto py-2">
              {workspaces.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No workspaces found
                </div>
              ) : (
                workspaces.map((workspace) => (
                  <button
                    key={workspace._id || workspace.id}
                    onClick={() => handleWorkspaceSelect(workspace)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      currentWorkspace?._id === workspace._id || currentWorkspace?.id === workspace.id
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{
                          background: workspace.background_type === 'gradient'
                            ? workspace.background_value
                            : workspace.primary_color
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{workspace.name}</div>
                        {workspace.description && (
                          <div className="text-xs text-gray-500 truncate">{workspace.description}</div>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="p-2 border-t border-gray-200">
              <button
                onClick={handleCreateNew}
                className="w-full flex items-center space-x-2 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Workspace</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WorkspaceSwitcher;
