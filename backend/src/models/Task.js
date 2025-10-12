const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    default: '',
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled', 'on-hold'],
    default: 'pending'
  },
  category: {
    type: String,
    enum: ['work', 'personal', 'meeting', 'email', 'planning', 'learning', 'health', 'other'],
    default: 'work'
  },
  dueDate: {
    type: Date,
    index: true
  },
  startDate: {
    type: Date
  },
  estimatedTime: {
    type: Number, // in minutes
    default: 30,
    min: 0
  },
  actualTime: {
    type: Number, // in minutes
    min: 0
  },
  priorityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  tags: [{
    type: String,
    trim: true
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  subtasks: [{
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date }
  }],
  aiGenerated: {
    type: Boolean,
    default: false
  },
  aiInsights: {
    priorityReason: String,
    suggestedTime: String,
    matrix: {
      type: String,
      enum: ['urgent-important', 'important', 'urgent', 'delegate', 'eliminate']
    },
    recommendations: [String]
  },
  completedAt: {
    type: Date
  },
  reminder: {
    enabled: { type: Boolean, default: false },
    time: Date,
    sent: { type: Boolean, default: false }
  },
  scheduleType: {
    type: String,
    enum: ['once', 'daily', 'weekly', 'monthly'],
    default: 'once'
  },
  recurrence: {
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom']
    },
    interval: { type: Number, default: 1 },
    daysOfWeek: [Number],
    endsOn: Date
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  comments: [{
    text: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, category: 1 });
taskSchema.index({ user: 1, priority: 1 });
taskSchema.index({ user: 1, dueDate: 1 });
taskSchema.index({ user: 1, completedAt: -1 });
taskSchema.index({ tags: 1 });

// Virtual for checking if task is overdue
taskSchema.virtual('isOverdue').get(function() {
  if (this.status === 'completed' || !this.dueDate) {
    return false;
  }
  return new Date() > this.dueDate;
});

// Virtual for completion percentage of subtasks
taskSchema.virtual('subtasksProgress').get(function() {
  if (!this.subtasks || this.subtasks.length === 0) {
    return 0;
  }
  const completed = this.subtasks.filter(st => st.completed).length;
  return Math.round((completed / this.subtasks.length) * 100);
});

// Auto-complete task when all subtasks are done
taskSchema.pre('save', function(next) {
  if (this.subtasks && this.subtasks.length > 0) {
    const allCompleted = this.subtasks.every(st => st.completed);
    if (allCompleted && this.status !== 'completed') {
      this.status = 'completed';
      this.completedAt = new Date();
    }
  }
  next();
});

// Set completedAt timestamp when status changes to completed
taskSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
