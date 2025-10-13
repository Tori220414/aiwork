import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ShoppingCart, Check, X, Download, Book, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface Supplier {
  _id?: string;
  id?: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface OrderItem {
  product: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
}

interface Order {
  _id?: string;
  id?: string;
  workspace_id: string;
  order_number: string;
  supplier: string;
  supplier_contact?: string;
  order_date: string;
  delivery_date: string;
  items: OrderItem[];
  subtotal: number;
  tax_amount: number;
  total: number;
  status: 'pending' | 'ordered' | 'delivered' | 'cancelled';
  notes?: string;
  created_at?: string;
}

interface OrdersProps {
  workspaceId: string;
}

const Orders: React.FC<OrdersProps> = ({ workspaceId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [orderNumber, setOrderNumber] = useState('');
  const [supplier, setSupplier] = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [items, setItems] = useState<OrderItem[]>([{ product: '', quantity: 1, unit: 'unit', price: 0, total: 0 }]);
  const [notes, setNotes] = useState('');

  const TAX_RATE = 10; // 10% GST

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
  }, [workspaceId]);

  const fetchOrders = async () => {
    try {
      const response = await api.get(`/workspaces/${workspaceId}/orders`);
      setOrders(response.data.orders || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await api.get(`/workspaces/${workspaceId}/suppliers`);
      setSuppliers(response.data.suppliers || []);
    } catch (error: any) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const saveSupplierToLibrary = async (supplierData: Omit<Supplier, '_id' | 'id'>) => {
    try {
      await api.post(`/workspaces/${workspaceId}/suppliers`, supplierData);
      await fetchSuppliers();
    } catch (error: any) {
      console.error('Error saving supplier:', error);
    }
  };

  const deleteSupplier = async (supplierId: string) => {
    if (!window.confirm('Delete this supplier from library?')) return;

    try {
      await api.delete(`/workspaces/${workspaceId}/suppliers/${supplierId}`);
      toast.success('Supplier deleted');
      fetchSuppliers();
    } catch (error: any) {
      toast.error('Failed to delete supplier');
    }
  };

  const selectSupplier = (selectedSupplier: Supplier) => {
    setSupplier(selectedSupplier.name);
    if (selectedSupplier.phone || selectedSupplier.email) {
      setSupplierContact(selectedSupplier.phone || selectedSupplier.email || '');
    }
    toast.success(`Selected ${selectedSupplier.name}`);
  };

  const calculateItemTotal = (quantity: number, price: number) => {
    return quantity * price;
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = (subtotal * TAX_RATE) / 100;
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'quantity' || field === 'price') {
      newItems[index].total = calculateItemTotal(newItems[index].quantity, newItems[index].price);
    }

    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { product: '', quantity: 1, unit: 'unit', price: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const resetForm = () => {
    setEditingOrder(null);
    setOrderNumber('');
    setSupplier('');
    setSupplierContact('');
    setOrderDate(new Date().toISOString().split('T')[0]);
    setDeliveryDate('');
    setItems([{ product: '', quantity: 1, unit: 'unit', price: 0, total: 0 }]);
    setNotes('');
    setShowForm(false);
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setOrderNumber(order.order_number);
    setSupplier(order.supplier);
    setSupplierContact(order.supplier_contact || '');
    setOrderDate(order.order_date.split('T')[0]);
    setDeliveryDate(order.delivery_date.split('T')[0]);
    setItems(order.items);
    setNotes(order.notes || '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplier || !orderNumber || !deliveryDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const { subtotal, taxAmount, total } = calculateTotals();

    const orderData = {
      workspace_id: workspaceId,
      order_number: orderNumber,
      supplier,
      supplier_contact: supplierContact,
      order_date: orderDate,
      delivery_date: deliveryDate,
      items,
      subtotal,
      tax_amount: taxAmount,
      total,
      status: 'pending' as const,
      notes
    };

    try {
      if (editingOrder) {
        await api.put(`/workspaces/${workspaceId}/orders/${editingOrder._id || editingOrder.id}`, orderData);
        toast.success('Order updated successfully');
      } else {
        await api.post(`/workspaces/${workspaceId}/orders`, orderData);
        toast.success('Order created successfully');
      }

      // Auto-save new supplier to library
      const existingSupplier = suppliers.find(s =>
        s.name.toLowerCase() === supplier.toLowerCase()
      );

      if (!existingSupplier && supplier) {
        await saveSupplierToLibrary({
          name: supplier,
          phone: supplierContact
        });
      }

      fetchOrders();
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save order');
    }
  };

  const handleDelete = async (order: Order) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;

    try {
      await api.delete(`/workspaces/${workspaceId}/orders/${order._id || order.id}`);
      toast.success('Order deleted successfully');
      fetchOrders();
    } catch (error: any) {
      toast.error('Failed to delete order');
    }
  };

  const updateStatus = async (order: Order, status: Order['status']) => {
    try {
      await api.put(`/workspaces/${workspaceId}/orders/${order._id || order.id}`, {
        ...order,
        status
      });
      toast.success('Order status updated');
      fetchOrders();
    } catch (error: any) {
      toast.error('Failed to update status');
    }
  };

  const downloadOrder = (order: Order) => {
    const csv = [
      ['Order Number', order.order_number],
      ['Supplier', order.supplier],
      ['Supplier Contact', order.supplier_contact || ''],
      ['Order Date', new Date(order.order_date).toLocaleDateString()],
      ['Delivery Date', new Date(order.delivery_date).toLocaleDateString()],
      ['Status', order.status.toUpperCase()],
      [''],
      ['Product', 'Quantity', 'Unit', 'Price', 'Total'],
      ...order.items.map(item => [
        item.product,
        item.quantity.toString(),
        item.unit,
        `$${item.price.toFixed(2)}`,
        `$${item.total.toFixed(2)}`
      ]),
      [''],
      ['Subtotal', '', '', '', `$${order.subtotal.toFixed(2)}`],
      ['GST (10%)', '', '', '', `$${order.tax_amount.toFixed(2)}`],
      ['Total', '', '', '', `$${order.total.toFixed(2)}`],
      [''],
      ['Notes', order.notes || '']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${order.order_number}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success('Order downloaded');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'ordered': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.contact_person && s.contact_person.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const { subtotal, taxAmount, total } = calculateTotals();

  if (loading) {
    return <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
        <div className="flex gap-2">
          {!showForm && (
            <>
              <button
                onClick={() => setShowLibrary(!showLibrary)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <Book className="w-4 h-4" />
                Supplier Library ({suppliers.length})
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="w-4 h-4" />
                New Order
              </button>
            </>
          )}
        </div>
      </div>

      {/* Supplier Library Modal */}
      {showLibrary && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Supplier Library</h3>
            <button
              onClick={() => setShowLibrary(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search suppliers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Contact Person</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Phone</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((sup) => (
                  <tr key={sup._id || sup.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium">{sup.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{sup.contact_person || '-'}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{sup.phone || '-'}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{sup.email || '-'}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        {showForm && (
                          <button
                            onClick={() => selectSupplier(sup)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Select supplier"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteSupplier(sup._id || sup.id || '')}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSuppliers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No suppliers in library yet</p>
                <p className="text-sm">Suppliers will be automatically saved when you create orders</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Number *
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="ORD-001"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                <span>Supplier *</span>
                <button
                  type="button"
                  onClick={() => setShowLibrary(!showLibrary)}
                  className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <Book className="w-3 h-3" />
                  {showLibrary ? 'Hide' : 'Show'} Library
                </button>
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
                list="suppliers-list"
              />
              <datalist id="suppliers-list">
                {suppliers.map(s => (
                  <option key={s._id || s.id} value={s.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier Contact
              </label>
              <input
                type="text"
                value={supplierContact}
                onChange={(e) => setSupplierContact(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Phone or email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Date
              </label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Date *
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          {/* Order Items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order Items</label>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2">
                  <input
                    type="text"
                    value={item.product}
                    onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                    className="col-span-4 px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Product name"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                    className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Qty"
                    min="0"
                    step="0.01"
                  />
                  <select
                    value={item.unit}
                    onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                    className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="unit">Unit</option>
                    <option value="case">Case</option>
                    <option value="carton">Carton</option>
                    <option value="kg">Kg</option>
                    <option value="litre">Litre</option>
                    <option value="dozen">Dozen</option>
                  </select>
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                    className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Price"
                    min="0"
                    step="0.01"
                  />
                  <div className="col-span-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg flex items-center text-sm">
                    ${item.total.toFixed(2)}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="col-span-1 p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    disabled={items.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addItem}
              className="mt-2 text-sm text-primary-600 hover:text-primary-700"
            >
              + Add Item
            </button>
          </div>

          {/* Totals */}
          <div className="border-t pt-4">
            <div className="space-y-2 max-w-xs ml-auto">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GST (10%):</span>
                <span className="font-medium">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
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
              placeholder="Special instructions or notes..."
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
              {editingOrder ? 'Update Order' : 'Create Order'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No orders yet</p>
              <p className="text-sm text-gray-500">Click "New Order" to create your first order</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order._id || order.id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{order.order_number}</h3>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-600 font-medium">{order.supplier}</p>
                    <p className="text-sm text-gray-500">Delivery: {new Date(order.delivery_date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">${order.total.toFixed(2)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => downloadOrder(order)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Download Order"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(order)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit Order"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(order)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete Order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex gap-2 flex-wrap">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(order, 'ordered')}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Check className="w-4 h-4 inline mr-1" />
                        Mark as Ordered
                      </button>
                    )}
                    {order.status === 'ordered' && (
                      <button
                        onClick={() => updateStatus(order, 'delivered')}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 inline mr-1" />
                        Mark as Delivered
                      </button>
                    )}
                    {order.status !== 'cancelled' && order.status !== 'delivered' && (
                      <button
                        onClick={() => updateStatus(order, 'cancelled')}
                        className="px-4 py-2 text-sm border border-red-600 text-red-600 rounded-lg hover:bg-red-50"
                      >
                        <X className="w-4 h-4 inline mr-1" />
                        Cancel Order
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

export default Orders;
