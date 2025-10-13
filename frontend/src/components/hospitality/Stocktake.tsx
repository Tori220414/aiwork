import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package, Download, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface StocktakeItem {
  product: string;
  category: string;
  unit: string;
  expected_quantity: number;
  actual_quantity: number;
  variance: number;
  value_per_unit: number;
  variance_value: number;
}

interface Stocktake {
  _id?: string;
  id?: string;
  workspace_id: string;
  stocktake_number: string;
  date: string;
  conducted_by: string;
  items: StocktakeItem[];
  total_variance_value: number;
  status: 'draft' | 'in_progress' | 'completed';
  notes?: string;
  created_at?: string;
}

interface StocktakeProps {
  workspaceId: string;
}

const Stocktake: React.FC<StocktakeProps> = ({ workspaceId }) => {
  const [stocktakes, setStocktakes] = useState<Stocktake[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStocktake, setEditingStocktake] = useState<Stocktake | null>(null);

  // Form state
  const [stocktakeNumber, setStocktakeNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [conductedBy, setConductedBy] = useState('');
  const [items, setItems] = useState<StocktakeItem[]>([
    { product: '', category: 'Beverage', unit: 'unit', expected_quantity: 0, actual_quantity: 0, variance: 0, value_per_unit: 0, variance_value: 0 }
  ]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchStocktakes();
  }, [workspaceId]);

  const fetchStocktakes = async () => {
    try {
      const response = await api.get(`/workspaces/${workspaceId}/stocktakes`);
      setStocktakes(response.data.stocktakes || []);
    } catch (error: any) {
      console.error('Error fetching stocktakes:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load stocktakes');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateVariance = (expected: number, actual: number, valuePerUnit: number) => {
    const variance = actual - expected;
    const varianceValue = variance * valuePerUnit;
    return { variance, varianceValue };
  };

  const calculateTotalVarianceValue = () => {
    return items.reduce((sum, item) => sum + item.variance_value, 0);
  };

  const handleItemChange = (index: number, field: keyof StocktakeItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'expected_quantity' || field === 'actual_quantity' || field === 'value_per_unit') {
      const { variance, varianceValue } = calculateVariance(
        newItems[index].expected_quantity,
        newItems[index].actual_quantity,
        newItems[index].value_per_unit
      );
      newItems[index].variance = variance;
      newItems[index].variance_value = varianceValue;
    }

    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { product: '', category: 'Beverage', unit: 'unit', expected_quantity: 0, actual_quantity: 0, variance: 0, value_per_unit: 0, variance_value: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const resetForm = () => {
    setEditingStocktake(null);
    setStocktakeNumber('');
    setDate(new Date().toISOString().split('T')[0]);
    setConductedBy('');
    setItems([{ product: '', category: 'Beverage', unit: 'unit', expected_quantity: 0, actual_quantity: 0, variance: 0, value_per_unit: 0, variance_value: 0 }]);
    setNotes('');
    setShowForm(false);
  };

  const handleEdit = (stocktake: Stocktake) => {
    setEditingStocktake(stocktake);
    setStocktakeNumber(stocktake.stocktake_number);
    setDate(stocktake.date.split('T')[0]);
    setConductedBy(stocktake.conducted_by);
    setItems(stocktake.items);
    setNotes(stocktake.notes || '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stocktakeNumber || !conductedBy) {
      toast.error('Please fill in all required fields');
      return;
    }

    const totalVarianceValue = calculateTotalVarianceValue();

    const stocktakeData = {
      workspace_id: workspaceId,
      stocktake_number: stocktakeNumber,
      date,
      conducted_by: conductedBy,
      items,
      total_variance_value: totalVarianceValue,
      status: 'draft' as const,
      notes
    };

    try {
      if (editingStocktake) {
        await api.put(`/workspaces/${workspaceId}/stocktakes/${editingStocktake._id || editingStocktake.id}`, stocktakeData);
        toast.success('Stocktake updated successfully');
      } else {
        await api.post(`/workspaces/${workspaceId}/stocktakes`, stocktakeData);
        toast.success('Stocktake created successfully');
      }
      fetchStocktakes();
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save stocktake');
    }
  };

  const handleDelete = async (stocktake: Stocktake) => {
    if (!window.confirm('Are you sure you want to delete this stocktake?')) return;

    try {
      await api.delete(`/workspaces/${workspaceId}/stocktakes/${stocktake._id || stocktake.id}`);
      toast.success('Stocktake deleted successfully');
      fetchStocktakes();
    } catch (error: any) {
      toast.error('Failed to delete stocktake');
    }
  };

  const updateStatus = async (stocktake: Stocktake, status: Stocktake['status']) => {
    try {
      await api.put(`/workspaces/${workspaceId}/stocktakes/${stocktake._id || stocktake.id}`, {
        ...stocktake,
        status
      });
      toast.success('Stocktake status updated');
      fetchStocktakes();
    } catch (error: any) {
      toast.error('Failed to update status');
    }
  };

  const downloadStocktake = (stocktake: Stocktake) => {
    const csv = [
      ['Product', 'Category', 'Unit', 'Expected', 'Actual', 'Variance', 'Value per Unit', 'Variance Value'],
      ...stocktake.items.map(item => [
        item.product,
        item.category,
        item.unit,
        item.expected_quantity,
        item.actual_quantity,
        item.variance,
        item.value_per_unit,
        item.variance_value.toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${stocktake.stocktake_number}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success('Stocktake downloaded');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Stocktake</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            New Stocktake
          </button>
        )}
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stocktake Number *
              </label>
              <input
                type="text"
                value={stocktakeNumber}
                onChange={(e) => setStocktakeNumber(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="STK-001"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conducted By *
              </label>
              <input
                type="text"
                value={conductedBy}
                onChange={(e) => setConductedBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Staff name"
                required
              />
            </div>
          </div>

          {/* Stocktake Items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Items</label>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Unit</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Expected</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Actual</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Variance</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Value/Unit</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Var. Value</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.product}
                          onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Product"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={item.category}
                          onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="Beverage">Beverage</option>
                          <option value="Food">Food</option>
                          <option value="Liquor">Liquor</option>
                          <option value="Supplies">Supplies</option>
                          <option value="Other">Other</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="unit">Unit</option>
                          <option value="case">Case</option>
                          <option value="bottle">Bottle</option>
                          <option value="kg">Kg</option>
                          <option value="litre">Litre</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.expected_quantity}
                          onChange={(e) => handleItemChange(index, 'expected_quantity', parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          step="0.01"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.actual_quantity}
                          onChange={(e) => handleItemChange(index, 'actual_quantity', parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          step="0.01"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-sm ${item.variance < 0 ? 'text-red-600' : item.variance > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                          {item.variance > 0 ? '+' : ''}{item.variance.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.value_per_unit}
                          onChange={(e) => handleItemChange(index, 'value_per_unit', parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          step="0.01"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-sm font-medium ${item.variance_value < 0 ? 'text-red-600' : item.variance_value > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                          ${item.variance_value.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          disabled={items.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="mt-2 text-sm text-primary-600 hover:text-primary-700"
            >
              + Add Item
            </button>
          </div>

          {/* Total Variance Value */}
          <div className="border-t pt-4">
            <div className="max-w-xs ml-auto">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Variance Value:</span>
                <span className={calculateTotalVarianceValue() < 0 ? 'text-red-600' : calculateTotalVarianceValue() > 0 ? 'text-green-600' : 'text-gray-900'}>
                  ${calculateTotalVarianceValue().toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Additional notes about discrepancies..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Save className="w-4 h-4 inline mr-2" />
              {editingStocktake ? 'Update Stocktake' : 'Save Stocktake'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {stocktakes.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No stocktakes yet</p>
              <p className="text-sm text-gray-500">Click "New Stocktake" to create your first stocktake</p>
            </div>
          ) : (
            stocktakes.map((stocktake) => (
              <div key={stocktake._id || stocktake.id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{stocktake.stocktake_number}</h3>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(stocktake.status)}`}>
                        {stocktake.status.toUpperCase().replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-gray-600">By: {stocktake.conducted_by}</p>
                    <p className="text-sm text-gray-500">Date: {new Date(stocktake.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${stocktake.total_variance_value < 0 ? 'text-red-600' : stocktake.total_variance_value > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                      ${stocktake.total_variance_value.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">Variance</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => downloadStocktake(stocktake)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Download CSV"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(stocktake)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(stocktake)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex gap-2">
                    {stocktake.status === 'draft' && (
                      <button
                        onClick={() => updateStatus(stocktake, 'in_progress')}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Start Stocktake
                      </button>
                    )}
                    {stocktake.status === 'in_progress' && (
                      <button
                        onClick={() => updateStatus(stocktake, 'completed')}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Mark as Completed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Stocktake;
