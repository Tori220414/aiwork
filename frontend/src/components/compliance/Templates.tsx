import React, { useState } from 'react';
import { Plus, Sparkles, Loader, CheckCircle2, Circle, Trash2, Save } from 'lucide-react';
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
}

interface TemplatesProps {
  workspaceId: string;
}

const Templates: React.FC<TemplatesProps> = ({ workspaceId }) => {
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Form state
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('hospitality');
  const [category, setCategory] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

  const industries = [
    { value: 'hospitality', label: 'Hospitality' },
    { value: 'construction', label: 'Construction & Building' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'finance', label: 'Finance & Banking' },
    { value: 'retail', label: 'Retail' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'other', label: 'Other' }
  ];

  const categories = [
    'Safety Compliance',
    'Health & Hygiene',
    'Financial Compliance',
    'Operational Standards',
    'Legal Requirements',
    'Environmental Compliance',
    'Quality Assurance',
    'Security Protocols',
    'Data Protection',
    'Employee Training'
  ];

  const handleGenerateChecklist = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please describe what checklist you need');
      return;
    }

    setGenerating(true);
    try {
      const response = await api.post(`/workspaces/${workspaceId}/templates/generate`, {
        prompt: aiPrompt,
        industry,
        category: category || 'General Compliance'
      });

      setChecklistItems(response.data.items);
      toast.success('Checklist generated successfully!');
    } catch (error: any) {
      console.error('Error generating checklist:', error);
      toast.error(error.response?.data?.message || 'Failed to generate checklist');
    } finally {
      setGenerating(false);
    }
  };

  const toggleItemComplete = (itemId: string) => {
    setChecklistItems(items =>
      items.map(item =>
        item.id === itemId
          ? {
              ...item,
              completed: !item.completed,
              completedAt: !item.completed ? new Date().toISOString() : null
            }
          : item
      )
    );
  };

  const updateItem = (itemId: string, field: 'text' | 'notes' | 'required', value: any) => {
    setChecklistItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const deleteItem = (itemId: string) => {
    setChecklistItems(items => items.filter(item => item.id !== itemId));
  };

  const addCustomItem = () => {
    const newItem: ChecklistItem = {
      id: `item-${Date.now()}`,
      text: '',
      required: true,
      notes: '',
      completed: false,
      completedAt: null,
      completedBy: null
    };
    setChecklistItems([...checklistItems, newItem]);
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    if (checklistItems.length === 0) {
      toast.error('Please add at least one checklist item');
      return;
    }

    try {
      await api.post(`/workspaces/${workspaceId}/templates`, {
        name: templateName,
        description,
        industry,
        category: category || 'General Compliance',
        items: checklistItems
      });

      toast.success('Template saved successfully!');
      resetForm();
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error(error.response?.data?.message || 'Failed to save template');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setTemplateName('');
    setDescription('');
    setIndustry('hospitality');
    setCategory('');
    setAiPrompt('');
    setChecklistItems([]);
  };

  const completionPercentage = checklistItems.length > 0
    ? (checklistItems.filter(item => item.completed).length / checklistItems.length) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Create Compliance Template</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        )}
      </div>

      {showForm ? (
        <div className="space-y-6">
          {/* Template Info */}
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Template Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Monthly Safety Inspection"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry *
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {industries.map(ind => (
                    <option key={ind.value} value={ind.value}>{ind.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select a category...</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this compliance template..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* AI Generation */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-md p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">AI Checklist Generator</h3>
            </div>

            <p className="text-sm text-gray-600">
              Describe what you need and AI will generate a comprehensive, industry-standard checklist based on regulatory requirements.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What do you need in your checklist?
              </label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., 'I need a daily kitchen hygiene checklist for my restaurant' or 'Create a construction site safety inspection checklist'"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              onClick={handleGenerateChecklist}
              disabled={generating || !aiPrompt.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Checklist with AI
                </>
              )}
            </button>
          </div>

          {/* Checklist Items */}
          {checklistItems.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Checklist Items</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {checklistItems.length} items · {completionPercentage.toFixed(0)}% complete
                  </p>
                </div>
                <button
                  onClick={addCustomItem}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {checklistItems.map((item) => (
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
                        onClick={() => toggleItemComplete(item.id)}
                        className="mt-1 flex-shrink-0"
                      >
                        {item.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-2">
                          <input
                            type="text"
                            value={item.text}
                            onChange={(e) => updateItem(item.id, 'text', e.target.value)}
                            placeholder="Checklist item..."
                            className={`flex-1 px-3 py-1.5 border border-gray-300 rounded-lg ${
                              item.completed ? 'line-through text-gray-500' : ''
                            }`}
                          />
                          <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={item.required}
                              onChange={(e) => updateItem(item.id, 'required', e.target.checked)}
                              className="rounded"
                            />
                            Required
                          </label>
                        </div>

                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                          placeholder="Additional notes or regulatory reference..."
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                        />
                      </div>

                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={resetForm}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveTemplate}
              disabled={!templateName.trim() || checklistItems.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Save Template
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No template in progress</p>
          <p className="text-sm text-gray-500">Click "New Template" to create a compliance checklist using AI</p>
        </div>
      )}
    </div>
  );
};

export default Templates;
