import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Grid, List, Calendar, TrendingUp, Plus, FileText, Pencil, ShoppingCart, Package, Trash2, Users, DollarSign, ClipboardCheck, BookOpen, ListChecks, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import CalendarView from '../components/CalendarView';
import EventModal from '../components/EventModal';
import EventDetailModal from '../components/EventDetailModal';
import InvoiceManager from '../components/InvoiceManager';
import Whiteboard from '../components/Whiteboard';
import Orders from '../components/hospitality/Orders';
import Stocktake from '../components/hospitality/Stocktake';
import Rosters from '../components/hospitality/Rosters';
import DailyTakings from '../components/hospitality/DailyTakings';
import Templates from '../components/compliance/Templates';
import SavedTemplates from '../components/compliance/SavedTemplates';
import ActiveChecklists from '../components/compliance/ActiveChecklists';
import Reports from '../components/compliance/Reports';
import WorkspaceMembers from '../components/WorkspaceMembers';
import type { EventFormData } from '../components/EventModal';

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
  memberRole?: string;
  boardConfigs?: BoardConfig[];
}

interface BoardConfig {
  _id: string;
  id: string;
  view_type: string;
  name: string;
  config: any;
  display_order: number;
}

interface Task {
  _id: string;
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  dueDate?: string;
  createdAt?: string;
}

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
}

const WorkspaceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<string>('kanban');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isEventDetailModalOpen, setIsEventDetailModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>();
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();

  useEffect(() => {
    if (id) {
      fetchWorkspaceData();
      fetchTasks();
      fetchEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchWorkspaceData = async () => {
    try {
      const response = await api.get(`/workspaces/${id}`);
      console.log('Workspace data:', response.data);
      console.log('Workspace name:', response.data.name);
      setWorkspace(response.data);

      // Set default view based on workspace type
      const workspaceName = response.data.name?.toLowerCase() || '';
      if (workspaceName.includes('compliance') || workspaceName.includes('checklist')) {
        setCurrentView('active');
      } else {
        setCurrentView(response.data.default_view || 'kanban');
      }
    } catch (error) {
      console.error('Error fetching workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks', {
        params: { workspace_id: id }
      });
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events', {
        params: { workspaceId: id }
      });
      setEvents(response.data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleAddEvent = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(undefined);
    setIsEventModalOpen(true);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEventId(event._id || event.id);
    setIsEventDetailModalOpen(true);
  };

  const handleEditEvent = () => {
    const event = events.find(e => (e._id || e.id) === selectedEventId);
    if (event) {
      setSelectedEvent(event);
      setIsEventDetailModalOpen(false);
      setIsEventModalOpen(true);
    }
  };

  const handleDeleteEvent = async () => {
    if (selectedEventId && window.confirm('Are you sure you want to delete this event?')) {
      try {
        await api.delete(`/events/${selectedEventId}`);
        await fetchEvents();
        setIsEventDetailModalOpen(false);
        setSelectedEventId(undefined);
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const handleSaveEvent = async (eventData: EventFormData) => {
    try {
      if (selectedEvent) {
        // Update existing event
        await api.put(`/events/${selectedEvent._id || selectedEvent.id}`, eventData);
      } else {
        // Create new event
        await api.post('/events', eventData);
      }
      await fetchEvents();
      setIsEventModalOpen(false);
      setSelectedDate(undefined);
      setSelectedEvent(undefined);
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!window.confirm(`Are you sure you want to delete "${workspace?.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/workspaces/${id}`);
      toast.success('Workspace deleted successfully');
      navigate('/workspaces');
    } catch (error: any) {
      console.error('Error deleting workspace:', error);
      toast.error(error.response?.data?.message || 'Failed to delete workspace');
    }
  };

  const getViewIcon = (view: string) => {
    switch (view) {
      case 'kanban': return <Grid className="w-4 h-4" />;
      case 'list': return <List className="w-4 h-4" />;
      case 'calendar': return <Calendar className="w-4 h-4" />;
      case 'timeline': return <TrendingUp className="w-4 h-4" />;
      case 'invoices': return <FileText className="w-4 h-4" />;
      case 'whiteboard': return <Pencil className="w-4 h-4" />;
      case 'orders': return <ShoppingCart className="w-4 h-4" />;
      case 'stocktake': return <Package className="w-4 h-4" />;
      case 'rosters': return <Users className="w-4 h-4" />;
      case 'takings': return <DollarSign className="w-4 h-4" />;
      case 'templates': return <ClipboardCheck className="w-4 h-4" />;
      case 'saved': return <BookOpen className="w-4 h-4" />;
      case 'active': return <ListChecks className="w-4 h-4" />;
      case 'reports': return <BarChart3 className="w-4 h-4" />;
      case 'members': return <Users className="w-4 h-4" />;
      default: return <Grid className="w-4 h-4" />;
    }
  };

  const isBuilderWorkspace = () => {
    const isBuilder = workspace?.name?.toLowerCase().includes('builder') ||
                      workspace?.name?.toLowerCase().includes('contractor');
    console.log('isBuilderWorkspace check:', {
      workspaceName: workspace?.name,
      isBuilder
    });
    return isBuilder;
  };

  const isHospitalityWorkspace = () => {
    const isHospitality = workspace?.name?.toLowerCase().includes('hospitality') ||
                          workspace?.name?.toLowerCase().includes('pub') ||
                          workspace?.name?.toLowerCase().includes('hotel') ||
                          workspace?.name?.toLowerCase().includes('club') ||
                          workspace?.name?.toLowerCase().includes('licensee');
    console.log('isHospitalityWorkspace check:', {
      workspaceName: workspace?.name,
      isHospitality
    });
    return isHospitality;
  };

  const isComplianceWorkspace = () => {
    const isCompliance = workspace?.name?.toLowerCase().includes('compliance') ||
                        workspace?.name?.toLowerCase().includes('checklist');
    console.log('isComplianceWorkspace check:', {
      workspaceName: workspace?.name,
      isCompliance
    });
    return isCompliance;
  };

  const renderKanbanView = () => {
    const columns = [
      { id: 'pending', title: 'To Do', color: 'bg-gray-100' },
      { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100' },
      { id: 'completed', title: 'Done', color: 'bg-green-100' }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col">
            <div className={`${column.color} rounded-t-lg px-4 py-3 border-b-2`} style={{ borderColor: workspace?.primary_color }}>
              <h3 className="font-semibold text-gray-900">{column.title}</h3>
              <span className="text-sm text-gray-500">
                {tasks.filter(t => t.status === column.id).length} tasks
              </span>
            </div>
            <div className="bg-white rounded-b-lg p-4 space-y-3 min-h-[400px] border border-gray-200 border-t-0">
              {tasks.filter(t => t.status === column.id).map((task) => (
                <div
                  key={task._id || task.id}
                  className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                >
                  <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                  {task.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">{task.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {task.priority}
                    </span>
                    <span className="text-xs text-gray-500">{task.category}</span>
                  </div>
                  {(task as any).assigned_to_user && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-600">
                      <Users className="w-3 h-3" />
                      <span>{(task as any).assigned_to_user.name || (task as any).assigned_to_user.email}</span>
                    </div>
                  )}
                </div>
              ))}
              {tasks.filter(t => t.status === column.id).length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">No tasks</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderListView = () => {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr key={task._id || task.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{task.title}</div>
                    {task.description && (
                      <div className="text-sm text-gray-500 line-clamp-1">{task.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{task.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>No tasks found</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Workspace not found</p>
        <button
          onClick={() => navigate('/workspaces')}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Back to Workspaces
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with gradient background */}
      <div
        className="rounded-lg p-6 text-white"
        style={{
          background: workspace.background_type === 'gradient'
            ? workspace.background_value
            : workspace.primary_color
        }}
      >
        <button
          onClick={() => navigate('/workspaces')}
          className="flex items-center space-x-2 text-white/90 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workspaces</span>
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{workspace.name}</h1>
            {workspace.description && (
              <p className="text-white/90">{workspace.description}</p>
            )}
            <p className="text-xs text-white/70 mt-1">
              {isBuilderWorkspace() && '✓ Builder workspace features enabled'}
              {isHospitalityWorkspace() && '✓ Hospitality workspace features enabled'}
              {isComplianceWorkspace() && '✓ Compliance workspace features enabled'}
              {!isBuilderWorkspace() && !isHospitalityWorkspace() && !isComplianceWorkspace() && 'Standard workspace'}
            </p>
          </div>
          <button
            onClick={handleDeleteWorkspace}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-white hover:bg-red-500/30 rounded-lg border border-white/20 transition-colors"
            title="Delete Workspace"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm">Delete Workspace</span>
          </button>
        </div>
      </div>

      {/* View Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 p-1">
          {['kanban', 'list', 'calendar', 'timeline'].map((view) => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                currentView === view
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {getViewIcon(view)}
              <span className="capitalize text-sm font-medium">{view}</span>
            </button>
          ))}
          {isBuilderWorkspace() && (
            <>
              <button
                onClick={() => setCurrentView('invoices')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'invoices'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {getViewIcon('invoices')}
                <span className="capitalize text-sm font-medium">Invoices</span>
              </button>
              <button
                onClick={() => setCurrentView('whiteboard')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'whiteboard'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {getViewIcon('whiteboard')}
                <span className="capitalize text-sm font-medium">Whiteboard</span>
              </button>
            </>
          )}
          {isHospitalityWorkspace() && (
            <>
              <button
                onClick={() => setCurrentView('orders')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'orders'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {getViewIcon('orders')}
                <span className="capitalize text-sm font-medium">Orders</span>
              </button>
              <button
                onClick={() => setCurrentView('stocktake')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'stocktake'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {getViewIcon('stocktake')}
                <span className="capitalize text-sm font-medium">Stocktake</span>
              </button>
              <button
                onClick={() => setCurrentView('rosters')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'rosters'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {getViewIcon('rosters')}
                <span className="capitalize text-sm font-medium">Rosters</span>
              </button>
              <button
                onClick={() => setCurrentView('takings')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'takings'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {getViewIcon('takings')}
                <span className="capitalize text-sm font-medium">Takings</span>
              </button>
              <button
                onClick={() => setCurrentView('invoices')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'invoices'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {getViewIcon('invoices')}
                <span className="capitalize text-sm font-medium">Invoices</span>
              </button>
            </>
          )}
          {isComplianceWorkspace() && (
            <>
              <button
                onClick={() => setCurrentView('active')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'active'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {getViewIcon('active')}
                <span className="capitalize text-sm font-medium">Active</span>
              </button>
              <button
                onClick={() => setCurrentView('templates')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'templates'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {getViewIcon('templates')}
                <span className="capitalize text-sm font-medium">Templates</span>
              </button>
              <button
                onClick={() => setCurrentView('saved')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'saved'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {getViewIcon('saved')}
                <span className="capitalize text-sm font-medium">Saved</span>
              </button>
              <button
                onClick={() => setCurrentView('reports')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'reports'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {getViewIcon('reports')}
                <span className="capitalize text-sm font-medium">Reports</span>
              </button>
            </>
          )}
          {workspace.workspace_type === 'team' && (
            <button
              onClick={() => setCurrentView('members')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                currentView === 'members'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {getViewIcon('members')}
              <span className="capitalize text-sm font-medium">Members</span>
            </button>
          )}
        </div>

        {!isComplianceWorkspace() && currentView !== 'members' && (
          <button
            onClick={() => navigate('/tasks')}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        )}
      </div>

      {/* View Content */}
      <div>
        {currentView === 'kanban' && renderKanbanView()}
        {currentView === 'list' && renderListView()}
        {currentView === 'calendar' && (
          <CalendarView
            tasks={tasks}
            events={events}
            primaryColor={workspace?.primary_color}
            onAddEvent={handleAddEvent}
            onEventClick={handleEventClick}
          />
        )}
        {currentView === 'timeline' && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500 mb-4">Timeline view coming soon!</p>
            <button
              onClick={() => setCurrentView('kanban')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Switch to Kanban View
            </button>
          </div>
        )}
        {currentView === 'invoices' && (isBuilderWorkspace() || isHospitalityWorkspace()) && (
          <InvoiceManager workspaceId={id || ''} />
        )}
        {currentView === 'whiteboard' && isBuilderWorkspace() && (
          <Whiteboard workspaceId={id || ''} />
        )}
        {currentView === 'orders' && isHospitalityWorkspace() && (
          <Orders workspaceId={id || ''} />
        )}
        {currentView === 'stocktake' && isHospitalityWorkspace() && (
          <Stocktake workspaceId={id || ''} />
        )}
        {currentView === 'rosters' && isHospitalityWorkspace() && (
          <Rosters workspaceId={id || ''} />
        )}
        {currentView === 'takings' && isHospitalityWorkspace() && (
          <DailyTakings workspaceId={id || ''} />
        )}
        {currentView === 'active' && isComplianceWorkspace() && (
          <ActiveChecklists workspaceId={id || ''} />
        )}
        {currentView === 'templates' && isComplianceWorkspace() && (
          <Templates workspaceId={id || ''} />
        )}
        {currentView === 'saved' && isComplianceWorkspace() && (
          <SavedTemplates workspaceId={id || ''} />
        )}
        {currentView === 'reports' && isComplianceWorkspace() && (
          <Reports workspaceId={id || ''} />
        )}
        {currentView === 'members' && workspace.workspace_type === 'team' && (
          <WorkspaceMembers
            workspaceId={id || ''}
            userRole={workspace.memberRole}
          />
        )}
      </div>

      {/* Event Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setSelectedDate(undefined);
          setSelectedEvent(undefined);
        }}
        onSave={handleSaveEvent}
        initialDate={selectedDate}
        event={selectedEvent}
        workspaceId={id}
      />

      {/* Event Detail Modal */}
      {selectedEventId && (
        <EventDetailModal
          isOpen={isEventDetailModalOpen}
          onClose={() => {
            setIsEventDetailModalOpen(false);
            setSelectedEventId(undefined);
          }}
          eventId={selectedEventId}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
        />
      )}
    </div>
  );
};

export default WorkspaceDetail;
