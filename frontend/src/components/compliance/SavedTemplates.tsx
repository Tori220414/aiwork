import React, { useState, useEffect } from 'react';
import { FileText, Edit2, Trash2, Copy, Eye, Search, Filter } from 'lucide-react';
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

interface Template {
  id: string;
  name: string;
  description?: string;
  industry: string;
  category?: string;
  items: ChecklistItem[];
  created_at: string;
}

interface SavedTemplatesProps {
  workspaceId: string;
}

const SavedTemplates: React.FC<SavedTemplatesProps> = ({ workspaceId }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null);

  const industries = [
    { value: 'all', label: 'All Industries' },
    { value: 'hospitality', label: 'Hospitality' },
    { value: 'construction', label: 'Construction & Building' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'finance', label: 'Finance & Banking' },
    { value: 'retail', label: 'Retail' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchTemplates();
  }, [workspaceId]);

  const fetchTemplates = async () => {
    try {
      const response = await api.get(`/workspaces/${workspaceId}/templates`);
      setTemplates(response.data.templates || []);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load templates');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      await api.delete(`/workspaces/${workspaceId}/templates/${templateId}`);
      toast.success('Template deleted successfully');
      fetchTemplates();
    } catch (error: any) {
      toast.error('Failed to delete template');
    }
  };

  const handleDuplicate = async (template: Template) => {
    try {
      await api.post(`/workspaces/${workspaceId}/templates`, {
        name: `${template.name} (Copy)`,
        description: template.description,
        industry: template.industry,
        category: template.category,
        items: template.items
      });
      toast.success('Template duplicated successfully');
      fetchTemplates();
    } catch (error: any) {
      toast.error('Failed to duplicate template');
    }
  };

  const getIndustryColor = (industry: string) => {
    const colors: Record<string, string> = {
      hospitality: 'bg-orange-100 text-orange-800',
      construction: 'bg-yellow-100 text-yellow-800',
      healthcare: 'bg-red-100 text-red-800',
      finance: 'bg-green-100 text-green-800',
      retail: 'bg-blue-100 text-blue-800',
      manufacturing: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[industry] || colors.other;
  };

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = filterIndustry === 'all' || template.industry === filterIndustry;
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    return matchesSearch && matchesIndustry && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(templates.map(t => t.category).filter(Boolean)));

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
        <h2 className="text-2xl font-bold text-gray-900">Saved Templates</h2>
        <span className="text-sm text-gray-500">{templates.length} templates</span>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <select
              value={filterIndustry}
              onChange={(e) => setFilterIndustry(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg appearance-none"
            >
              {industries.map(ind => (
                <option key={ind.value} value={ind.value}>{ind.label}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg appearance-none"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">
            {templates.length === 0 ? 'No templates yet' : 'No templates match your filters'}
          </p>
          <p className="text-sm text-gray-500">
            {templates.length === 0
              ? 'Create your first compliance template'
              : 'Try adjusting your search or filters'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {template.name}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getIndustryColor(template.industry)}`}>
                      {template.industry}
                    </span>
                    {template.category && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {template.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {template.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {template.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{template.items.length} items</span>
                <span>{new Date(template.created_at).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewingTemplate(template)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button
                  onClick={() => handleDuplicate(template)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Template Modal */}
      {viewingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {viewingTemplate.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getIndustryColor(viewingTemplate.industry)}`}>
                      {viewingTemplate.industry}
                    </span>
                    {viewingTemplate.category && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {viewingTemplate.category}
                      </span>
                    )}
                  </div>
                  {viewingTemplate.description && (
                    <p className="text-sm text-gray-600 mt-2">{viewingTemplate.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setViewingTemplate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <h4 className="font-semibold text-gray-900 mb-4">
                Checklist Items ({viewingTemplate.items.length})
              </h4>
              <div className="space-y-3">
                {viewingTemplate.items.map((item, index) => (
                  <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900">{item.text}</p>
                          {item.required && (
                            <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full flex-shrink-0">
                              Required
                            </span>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
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
                  onClick={() => setViewingTemplate(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleDuplicate(viewingTemplate);
                    setViewingTemplate(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedTemplates;
