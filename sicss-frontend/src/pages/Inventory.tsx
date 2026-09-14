import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { inventoryItemService, type InventoryItem } from '../services/inventoryItemService';
import { Button, Card, CardContent, LoadingState } from '../components/ui';
import { FormModal } from '../components/FormModal';

export default function Inventory() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showLowStock, setShowLowStock] = useState(false);

  useEffect(() => {
    loadItems();
  }, [filterCategory, showLowStock]);

  const loadItems = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (filterCategory !== 'all') {
        params.category = filterCategory;
      }
      if (showLowStock) {
        params.low_stock = true;
      }
      const data = await inventoryItemService.getAll(params);
      setItems(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load inventory items.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (itemData: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingItem?.id) {
        await inventoryItemService.update(editingItem.id, itemData);
      } else {
        await inventoryItemService.create(itemData);
      }
      await loadItems();
      setIsOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save item.');
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await inventoryItemService.delete(id);
      await loadItems();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete item.');
    }
  };

  const isLowStock = (item: InventoryItem) => {
    return item.quantity <= item.minimum_stock;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Inventory/Asset Management</h1>
        <p className="mt-2 text-slate-600">Track school inventory and assets</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm font-medium text-slate-700">Filter by Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {Array.from(new Set(items.map(i => i.category).filter(Boolean))).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
                className="rounded border-slate-300"
              />
              Show Low Stock Only
            </label>
          </div>
          {isAdmin && (
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setEditingItem(null);
                  setIsOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-md"
              >
                + Add Item
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
          <p className="text-sm text-rose-800 mb-4">{error}</p>
          <Button onClick={loadItems} className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold">
            Try Again
          </Button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm">
          <LoadingState message="Loading inventory items..." />
        </div>
      ) : (
        <div className="space-y-4">
          {items.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No inventory items found for the selected criteria.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <Card key={item.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold text-slate-900">{item.name}</h3>
                      {!item.is_active && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-3">Code: {item.item_code}</p>
                    {item.category && (
                      <span className="inline-block px-2 py-1 rounded text-xs bg-slate-100 text-slate-700 mb-3">
                        {item.category}
                      </span>
                    )}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Quantity:</span>
                        <span className={`font-semibold ${isLowStock(item) ? 'text-red-600' : 'text-slate-900'}`}>
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Min Stock:</span>
                        <span className="text-slate-900">{item.minimum_stock} {item.unit}</span>
                      </div>
                      {item.unit_price && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Unit Price:</span>
                          <span className="text-slate-900">${item.unit_price.toFixed(2)}</span>
                        </div>
                      )}
                      {item.location && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Location:</span>
                          <span className="text-slate-900">{item.location}</span>
                        </div>
                      )}
                    </div>
                    {isLowStock(item) && (
                      <div className="mt-3 px-3 py-1 rounded text-xs font-semibold bg-red-100 text-red-800 text-center">
                        Low Stock
                      </div>
                    )}
                    {isAdmin && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={() => handleEdit(item)}
                          className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold border border-slate-300 px-2 py-1 text-xs"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => item.id && handleDelete(item.id)}
                          className="bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-700 font-semibold border border-red-300 px-2 py-1 text-xs"
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <FormModal
        isOpen={isOpen}
        title={editingItem?.id ? 'Edit Item' : 'Add Item'}
        onClose={() => {
          setIsOpen(false);
          setEditingItem(null);
        }}
        onSubmit={() => editingItem && handleSave(editingItem)}
        submitText={editingItem?.id ? 'Update' : 'Create'}
        isLoading={false}
      >
        <InventoryForm item={editingItem} onChange={setEditingItem} />
      </FormModal>
    </div>
  );
}

function InventoryForm({ item, onChange }: any) {
  const [formData, setFormData] = useState<Partial<InventoryItem>>(
    item || {
      item_code: '',
      name: '',
      description: '',
      category: '',
      location: '',
      quantity: 0,
      minimum_stock: 0,
      unit: '',
      unit_price: 0,
      is_active: true,
    }
  );

  useEffect(() => {
    onChange(formData);
  }, [formData]);

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Item Code</label>
        <input
          type="text"
          value={formData.item_code}
          onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
        <input
          type="text"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Location</label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Quantity</label>
          <input
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Minimum Stock</label>
          <input
            type="number"
            value={formData.minimum_stock}
            onChange={(e) => setFormData({ ...formData, minimum_stock: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Unit</label>
          <input
            type="text"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., pcs, kg, liters"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Unit Price</label>
          <input
            type="number"
            step="0.01"
            value={formData.unit_price}
            onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
