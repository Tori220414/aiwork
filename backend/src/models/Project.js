const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  description: {
    type: String,
    default: '',
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  color: {
    type: String,
    default: '#3B82F6', // Default blue color
    match: [/^#[0-9A-F]{6}$/i, 'Please provide a valid hex color']
  },
  icon: {
    type: String,
    default: 'folder'
  },
  status: {
    type: String,
    enum: ['active', 'on-hold', 'completed', 'archived'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  targetDate: {
    type: Date
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  stats: {
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    inProgressTasks: { type: Number, default: 0 },
    pendingTasks: { type: Number, default: 0 }
  },
  team: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      default: 'member'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
projectSchema.index({ user: 1, status: 1 });
projectSchema.index({ user: 1, isArchived: 1 });
projectSchema.index({ tags: 1 });

// Virtual to check if project is overdue
projectSchema.virtual('isOverdue').get(function() {
  if (this.status === 'completed' || !this.targetDate) {
    return false;
  }
  return new Date() > this.targetDate;
});

// Update progress based on task completion
projectSchema.methods.updateProgress = async function() {
  const Task = mongoose.model('Task');
  const tasks = await Task.find({ project: this._id });

  if (tasks.length === 0) {
    this.progress = 0;
    this.stats.totalTasks = 0;
    this.stats.completedTasks = 0;
    this.stats.inProgressTasks = 0;
    this.stats.pendingTasks = 0;
  } else {
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const pending = tasks.filter(t => t.status === 'pending').length;

    this.progress = Math.round((completed / tasks.length) * 100);
    this.stats.totalTasks = tasks.length;
    this.stats.completedTasks = completed;
    this.stats.inProgressTasks = inProgress;
    this.stats.pendingTasks = pending;
  }

  await this.save();
};

module.exports = mongoose.model('Project', projectSchema);
