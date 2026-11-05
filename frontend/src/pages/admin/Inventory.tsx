import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext.tsx';
import { Product } from '../../types/models';
import { Plus, Minus, Save, X } from 'lucide-react';

interface InventoryItem extends Product {
  sku?: string;
}

const InventoryManager: React.FC = () => {
  const { products, showToast } = useShop();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const handleUpdateStock = async (productId: number) => {
    setLoading(true);
    try {
      const response = await fetch('/api/products/inventory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, quantity: editValue }),
      });

      if (!response.ok) throw new Error('Failed to update stock');

      showToast('Stock updated successfully', 'success');
      setEditingId(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shell fade-up py-6 space-y-5 phone-lg:space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold text-body tracking-tight phone-lg:text-[26px] 3xl:text-3xl">Inventory Management</h1>
          <p className="text-[13px] text-quiet">Manage product availability and SKU tracking</p>
        </div>
        <div className="shrink-0 px-3 py-1.5 phone-lg:px-4 phone-lg:py-2 bg-accent-soft text-accent rounded-full text-[11px] phone-lg:text-sm font-bold border border-hairline">
          Admin Access
        </div>
      </div>

      <div className="thin-scroll overflow-x-auto rounded-[20px] border border-hairline bg-panel backdrop-blur-xl shadow-quiet">
        <table className="w-full min-w-[34rem] text-left border-collapse">
          <thead>
            <tr className="bg-recess text-quiet text-xs uppercase tracking-widest">
              <th className="p-4 font-bold">Product</th>
              <th className="p-4 font-bold">SKU</th>
              <th className="p-4 font-bold">Current Stock</th>
              <th className="p-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-recess/50 transition-colors group">
                <td className="p-4 text-body font-semibold">{product.title}</td>
                <td className="p-4 text-quiet font-mono text-xs">
                  {(product as any).sku || 'N/A'}
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    product.stock <= 10
                      ? 'bg-[#9B3B22]/10 text-[#9B3B22] border border-hairline'
                      : 'bg-solid/10 text-body border border-hairline'
                  }`}>
                    {product.stock} units
                  </span>
                </td>
                <td className="p-4 text-right">
                  {editingId === product.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <div className="flex items-center bg-recess rounded-lg border border-hairline overflow-hidden">
                        <button
                          onClick={() => setEditValue(v => Math.max(0, v - 1))}
                          className="p-1 hover:bg-border-subtle text-body transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                          className="w-12 text-center bg-transparent border-none text-sm text-body outline-none"
                        />
                        <button
                          onClick={() => setEditValue(v => v + 1)}
                          className="p-1 hover:bg-border-subtle text-body transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => handleUpdateStock(product.id)}
                        disabled={loading}
                        className="p-2 bg-solid text-on-solid rounded-lg hover:opacity-90 transition-colors"
                        title="Save"
                      >
                        <Save size={14} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-2 bg-recess text-quiet rounded-lg hover:bg-border-subtle transition-colors"
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingId(product.id);
                        setEditValue(product.stock);
                      }}
                      className="px-4 py-2 bg-recess hover:bg-panel text-body text-xs font-bold rounded-xl border border-hairline transition-all active:scale-95 shadow-quiet"
                    >
                      Update Stock
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryManager;
