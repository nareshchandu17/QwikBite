import React, { useState, useEffect } from "react";
import { XIcon } from "../icons";
import { InventoryItem } from "../../types/inventory";

/* =========================
   ADD ITEM MODAL
========================= */
interface AddItemModalProps {
  onClose: () => void;
  onSave: (item: {
    name: string;
    category: string;
    quantity: string;
    unit: string;
  }) => void;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState<string>("");
  const [unit, setUnit] = useState("pcs");

  const units = ["pcs", "kgs", "gms", "ml", "liters", "packets", "boxes"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, category, quantity, unit });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-white/10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Add Inventory Item</h3>
          <button onClick={onClose}>
            <XIcon className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full p-3 rounded-xl bg-white/5 text-white border border-white/10"
            placeholder="Item name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="w-full p-3 rounded-xl bg-white/5 text-white border border-white/10"
            placeholder="Category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <div className="flex gap-3">
            <input
              type="text"
              className="flex-1 p-3 rounded-xl bg-white/5 text-white border border-white/10"
              placeholder="Quantity (e.g., 15kgs, 10liters, 5packets)"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <select
              className="w-24 p-3 rounded-xl bg-gray-800 text-white border border-white/10 focus:outline-none"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-[#FF512F] text-white font-bold cursor-pointer"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* =========================
   RESTOCK MODAL
========================= */
interface RestockModalProps {
  item: InventoryItem;
  onClose: () => void;
  onSave: (id: string, quantity: string) => void;
}

const RestockModal: React.FC<RestockModalProps> = ({ item, onClose, onSave }) => {
  const [quantity, setQuantity] = useState<string>(item.quantity.toString());

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-white/10">
        <h3 className="text-lg font-bold text-white mb-4">
          Update Stock – {item.name}
        </h3>

        <div className="flex items-center gap-3 mb-4">
          <input
            type="text"
            className="flex-1 p-3 rounded-xl bg-white/5 text-white border border-white/10"
            placeholder="Enter quantity (e.g., 15kgs, 10liters)"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <span className="text-gray-400 font-bold">{item.unit}</span>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(item.id, quantity);
              onClose();
            }}
            className="px-6 py-2 rounded-xl bg-blue-600 text-white font-bold cursor-pointer hover:bg-blue-600/80 transition-colors"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================
   SKELETON COMPONENT
========================= */
const InventorySkeleton: React.FC = () => {
  return (
    <tr className="border-t border-white/5 animate-pulse">
      <td className="p-4"><div className="w-32 h-4 rounded bg-white/10"></div></td>
      <td className="p-4"><div className="w-24 h-4 rounded bg-white/10"></div></td>
      <td className="p-4"><div className="w-16 h-4 rounded bg-white/10"></div></td>
      <td className="p-4"><div className="w-24 h-6 rounded-full bg-white/10"></div></td>
      <td className="p-4"><div className="w-24 h-4 rounded bg-white/10"></div></td>
      <td className="p-4 text-right"><div className="w-20 h-8 rounded-lg bg-white/10 ml-auto"></div></td>
    </tr>
  );
};

/* =========================
   MAIN COMPONENT
========================= */
const InventoryAlerts: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);

  /* ===== FETCH INVENTORY ===== */
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/inventory");

        if (!res.ok) {
          console.error(`API error: ${res.status} ${res.statusText}`);
          setItems([]);
          return;
        }

        const text = await res.text();
        if (!text) {
          console.error('Empty response from inventory API');
          setItems([]);
          return;
        }

        const data = JSON.parse(text);

        setItems(
          Array.isArray(data) ? data.map((item: any) => ({
            id: item._id,
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit || "pcs",
            status: item.status,
            lastUpdated: new Date(item.updatedAt).toLocaleString(),
          })) : []
        );
      } catch (error) {
        console.error('Error fetching inventory:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  /* ===== STATUS STYLES ===== */
  const getStatusStyle = (status: InventoryItem["status"]) => {
    switch (status) {
      case "In_Stock":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Low_Stock":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Out_of_Stock":
        return "bg-red-500/20 text-red-400 border-red-500/30";
    }
  };

  /* ===== ADD ITEM ===== */
  const handleAddItem = async (item: {
    name: string;
    category: string;
    quantity: string;
    unit: string;
  }) => {
    try {
      console.log('Sending request with item:', item);

      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });

      console.log('Response status:', res.status, res.statusText);

      let data;
      try {
        data = await res.json();
        console.log('Response data:', data);
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        const text = await res.text();
        console.error('Raw response text:', text);
        throw new Error('Invalid response from server');
      }

      if (!res.ok) {
        console.error('API Error Response:', data);
        const errorMessage = data?.error ||
          data?.message ||
          `Server responded with status: ${res.status}`;
        throw new Error(errorMessage);
      }

      setItems((prev) => [
        {
          id: data._id,
          name: data.name,
          category: data.category,
          quantity: data.quantity,
          unit: data.unit || "pcs",
          status: data.status,
          lastUpdated: "Just now",
        },
        ...prev,
      ]);

      // You might want to add a success notification here
      // Example: toast.success('Item added successfully!');
    } catch (error) {
      console.error('Error adding item:', error);
      // You might want to add an error notification here
      // Example: toast.error(error.message || 'Failed to add item');
      throw error; // Re-throw to let the form handle the error if needed
    }
  };

  /* ===== RESTOCK ===== */
  const handleRestock = async (id: string, quantity: string) => {
    try {
      const res = await fetch("/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          quantity,
          status: parseFloat(quantity) > 0 ? "in-stock" : undefined
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update inventory');
      }

      const updatedItem = await res.json();

      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
              ...item,
              quantity: updatedItem.quantity,
              status: updatedItem.status,
              lastUpdated: "Just now",
            }
            : item
        )
      );

      // You might want to add a success notification here
      // Example: toast.success('Inventory updated successfully!');
    } catch (error) {
      console.error('Error updating inventory:', error);
      // You might want to add an error notification here
      // Example: toast.error(error.message || 'Failed to update inventory');
      throw error; // Re-throw to let the component handle the error if needed
    }
  };

  return (
    <div className="p-6">
      {addOpen && (
        <AddItemModal onClose={() => setAddOpen(false)} onSave={handleAddItem} />
      )}

      {restockItem && (
        <RestockModal
          item={restockItem}
          onClose={() => setRestockItem(null)}
          onSave={handleRestock}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">
          Inventory & Stock Alerts
        </h1>
        <button
          onClick={() => setAddOpen(true)}
          className="px-5 py-2 rounded-xl bg-[#FF512F] text-white font-bold cursor-pointer hover:bg-[#FF512F]/80 transition-colors"
        >
          + Add Item
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-gray-300 text-sm">
            <tr>
              <th className="p-4">Item</th>
              <th className="p-4">Category</th>
              <th className="p-4">Qty</th>
              <th className="p-4">Status</th>
              <th className="p-4">Updated</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => <InventorySkeleton key={i} />)
            ) : items.length > 0 ? (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-white/5 hover:bg-white/5"
                >
                  <td className="p-4 text-white">{item.name}</td>
                  <td className="p-4 text-gray-400">{item.category}</td>
                  <td className="p-4 font-mono text-white">
                    {item.quantity} <span className="text-xs text-gray-500 uppercase">{item.unit}</span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(
                        item.status
                      )}`}
                    >
                      {item.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-400">
                    {item.lastUpdated}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setRestockItem(item)}
                      className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm cursor-pointer transition-colors"
                    >
                      Restock
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No inventory items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryAlerts;
