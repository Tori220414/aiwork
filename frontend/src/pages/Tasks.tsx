import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTaskStore } from '../store/useTaskStore';
import { Task } from '../services/taskService';
import { Plus, Filter, Search, Edit2, Trash2, CheckCircle2, Square, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import TaskCreateModal from '../components/TaskCreateModal';

const Tasks: React.FC = () => {
  const location = useLocation();
  const { tasks, isLoading, fetchTasks, updateTask, deleteTask, createTask } = useTaskStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [isCreatingTasks, setIsCreatingTasks] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  // Handle tasks from brain dump
  useEffect(() => {
    const tasksToCreate = (location.state as any)?.tasksToCreate;
    if (tasksToCreate && tasksToCreate.length > 0) {
      handleCreateTasksFromBrainDump(tasksToCreate);
      // Clear the navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleCreateTasksFromBrainDump = async (tasksToCreate: Task[]) => {
    setIsCreatingTasks(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const task of tasksToCreate) {
        try {
          // Remove the _id and selected fields before creating
          const { _id, selected, ...taskData } = task as any;
          await createTask({
            ...taskData,
            aiGenerated: true
          });
          successCount++;
        } catch (error) {
          console.error('Error creating task:', error);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully created ${successCount} task${successCount > 1 ? 's' : ''} from your brain dump!`);
      }
      if (failCount > 0) {
        toast.error(`Failed to create ${failCount} task${failCount > 1 ? 's' : ''}`);
      }

      // Reload tasks after creating
      loadTasks();
    } finally {
      setIsCreatingTasks(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [filterStatus, filterPriority]);

  const loadTasks = () => {
    const filters: any = {};
    if (filterStatus) filters.status = filterStatus;
    if (filterPriority) filters.priority = filterPriority;
    if (searchQuery) filters.search = searchQuery;
    fetchTasks(filters);
  };

  const handleSearch = () => {
    loadTasks();
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await updateTask(task._id!, { status: newStatus });
      toast.success(`Task ${newStatus === 'completed' ? 'completed' : 'reopened'}!`);
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
        toast.success('Task deleted successfully');
      } catch (error) {
        toast.error('Failed to delete task');
      }
    }
  };

  const toggleSelectTask = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map(t => t._id!)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.size === 0) {
      toast.error('No tasks selected');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedTasks.size} task${selectedTasks.size > 1 ? 's' : ''}?`)) {
      let successCount = 0;
      let failCount = 0;

      try {
        // Convert Set to Array for iteration
        const taskIds = Array.from(selectedTasks);
        for (const taskId of taskIds) {
          try {
            await deleteTask(taskId);
            successCount++;
          } catch (error) {
            console.error('Error deleting task:', taskId, error);
            failCount++;
          }
        }

        if (successCount > 0) {
          toast.success(`Successfully deleted ${successCount} task${successCount > 1 ? 's' : ''}`);
        }
        if (failCount > 0) {
          toast.error(`Failed to delete ${failCount} task${failCount > 1 ? 's' : ''}`);
        }

        setSelectedTasks(new Set());
        setSelectMode(false);
      } catch (error) {
        toast.error('An error occurred during bulk delete');
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low': return 'bg-gray-100 text-gray-700 border-gray-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      case 'on-hold': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">
            {selectMode
              ? `${selectedTasks.size} task${selectedTasks.size !== 1 ? 's' : ''} selected`
              : 'Manage and organize your tasks'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectMode ? (
            <>
              <button
                onClick={() => {
                  setSelectMode(false);
                  setSelectedTasks(new Set());
                }}
                className="btn btn-secondary flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={selectedTasks.size === 0}
                className="btn bg-red-600 hover:bg-red-700 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Delete ({selectedTasks.size})
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setSelectMode(true)}
                className="btn btn-secondary flex items-center justify-center"
              >
                <CheckSquare className="w-5 h-5 mr-2" />
                Select
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary flex items-center justify-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Task
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        {selectMode && tasks.length > 0 && (
          <div className="mb-4 pb-4 border-b border-gray-200">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary-600 transition-colors"
            >
              {selectedTasks.size === tasks.length ? (
                <CheckSquare className="w-5 h-5 text-primary-600" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              <span className="font-medium">
                {selectedTasks.size === tasks.length ? 'Deselect All' : 'Select All'}
              </span>
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="input pl-10"
              />
            </div>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="input"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="card">
        {isLoading || isCreatingTasks ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            {isCreatingTasks && (
              <p className="mt-4 text-gray-600">Creating tasks from your brain dump...</p>
            )}
          </div>
        ) : tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task._id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectMode && selectedTasks.has(task._id!)
                    ? 'bg-primary-50 border-primary-400 shadow-md'
                    : task.status === 'completed'
                    ? 'bg-gray-50 border-gray-200'
                    : 'border-gray-200 hover:border-primary-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-4">
                  {selectMode ? (
                    <button
                      onClick={() => toggleSelectTask(task._id!)}
                      className="mt-1 flex-shrink-0"
                    >
                      {selectedTasks.has(task._id!) ? (
                        <CheckSquare className="w-6 h-6 text-primary-600" />
                      ) : (
                        <Square className="w-6 h-6 text-gray-400 hover:text-primary-500" />
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className="mt-1 flex-shrink-0"
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-primary-500" />
                      )}
                    </button>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className={`text-lg font-medium ${
                      task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}>
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700">
                        {task.category}
                      </span>
                      {task.scheduleType && task.scheduleType !== 'once' && (
                        <span className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700 border border-indigo-200">
                          🔄 {task.scheduleType}
                        </span>
                      )}
                      {task.recurrence && (
                        <span className="text-xs px-2 py-1 rounded bg-cyan-100 text-cyan-700 border border-cyan-200">
                          ♻️ Repeats {task.recurrence.type}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="text-xs text-gray-600">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {task.aiGenerated && (
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                          🤖 AI Generated
                        </span>
                      )}
                    </div>

                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {task.tags.map((tag, index) => (
                          <span key={index} className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {!selectMode && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toast('Edit functionality coming soon!')}
                        className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task._id!)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No tasks found</p>
            <p className="text-sm mt-1">Create a new task or adjust your filters</p>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      <TaskCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={createTask}
      />
    </div>
  );
};

export default Tasks;
