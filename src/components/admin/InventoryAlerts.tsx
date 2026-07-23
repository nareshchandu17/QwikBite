import React, { useState, useEffect } from "react";
import { XIcon } from "../icons";
import { toast } from "sonner";

// Status enum for consistency
export enum InventoryStatus {
  IN_STOCK = "In_Stock",
  LOW_STOCK = "Low_Stock",
  OUT_OF_STOCK = "Out_of_Stock",
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  status: InventoryStatus;
  lastUpdated: string;
}

// Validation utilities
const validateName = (value: string): string => {
  if (!value.trim()) return "Item name is required";
  if (value.trim().length < 2) return "Name must be at least 2 characters";
  if (value.trim().length > 100) return "Name must be less than 100 characters";
  return "";
};

const validateCategory = (value: string): string => {
  if (!value.trim()) return "Category is required";
  if (value.trim().length < 2) return "Category must be at least 2 characters";
  return "";
};

const validateQuantity = (value: string): string => {
  if (!value.trim()) return "Quantity is required";
  const num = parseFloat(value);
  if (isNaN(num)) return "Quantity must be a number";
  if (num < 0) return "Quantity must be positive";
  if (!Number.isInteger(num)) return "Quantity must be a whole number";
  return "";
};

/* =========================
   ADD ITEM MODAL
========================= */
interface AddItemModalProps {
  onClose: () => void;
  onSave: (item: {
    name: string;
    category: string;
    quantity: number;
    unit: string;
  }) => Promise<boolean>;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field validation states
  const [fieldStates, setFieldStates] = useState({
    name: { touched: false, valid: false, error: "" },
    category: { touched: false, valid: false, error: "" },
    quantity: { touched: false, valid: false, error: "" },
  });

  const units = ["pcs", "kgs", "gms", "ml", "liters", "packets", "boxes"];

  const handleBlur = (field: string, value: string) => {
    let error = "";
    let valid = false;

    if (field === "name") {
      error = validateName(value);
      valid = !error;
    } else if (field === "category") {
      error = validateCategory(value);
      valid = !error;
    } else if (field === "quantity") {
      error = validateQuantity(value);
      valid = !error;
    }

    setFieldStates(prev => ({
      ...prev,
      [field]: { touched: true, valid, error }
    }));
  };

  const handleChange = (field: string, value: string) => {
    if (field === "name") setName(value);
    if (field === "category") setCategory(value);
    if (field === "quantity") setQuantity(value);

    // Validate on change
    handleBlur(field, value);
  };

  const isFormValid = () => {
    return fieldStates.name.valid && 
           fieldStates.category.valid && 
           fieldStates.quantity.valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const nameError = validateName(name);
    const categoryError = validateCategory(category);
    const quantityError = validateQuantity(quantity);

    setFieldStates({
      name: { touched: true, valid: !nameError, error: nameError },
      category: { touched: true, valid: !categoryError, error: categoryError },
      quantity: { touched: true, valid: !quantityError, error: quantityError },
    });

    if (nameError || categoryError || quantityError) {
      toast.error("Please fix the form errors before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await onSave({
        name: name.trim(),
        category: category.trim(),
        quantity: parseFloat(quantity),
        unit,
      });

      if (success) {
        toast.success("Item added successfully!");
        onClose();
      }
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Failed to add item");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-white/10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Add Inventory Item</h3>
          <button onClick={onClose} disabled={isSubmitting}>
            <XIcon className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              className={`w-full p-3 rounded-xl bg-white/5 text-white border transition-colors ${
                fieldStates.name.touched
                  ? fieldStates.name.valid
                    ? "border-green-500 bg-green-500/5"
                    : "border-red-500 bg-red-500/5"
                  : "border-white/10"
              }`}
              placeholder="Item name"
              required
              value={name}
              onChange={(e) => handleChange("name", e.target.value)}
              onBlur={(e) => handleBlur("name", e.target.value)}
              disabled={isSubmitting}
            />
            {fieldStates.name.touched && fieldStates.name.error && (
              <p className="text-red-500 text-xs mt-1">{fieldStates.name.error}</p>
            )}
            {fieldStates.name.touched && fieldStates.name.valid && (
              <p className="text-green-500 text-xs mt-1">✓ Valid name</p>
            )}
          </div>

          <div>
            <input
              className={`w-full p-3 rounded-xl bg-white/5 text-white border transition-colors ${
                fieldStates.category.touched
                  ? fieldStates.category.valid
                    ? "border-green-500 bg-green-500/5"
                    : "border-red-500 bg-red-500/5"
                  : "border-white/10"
              }`}
              placeholder="Category"
              required
              value={category}
              onChange={(e) => handleChange("category", e.target.value)}
              onBlur={(e) => handleBlur("category", e.target.value)}
              disabled={isSubmitting}
            />
            {fieldStates.category.touched && fieldStates.category.error && (
              <p className="text-red-500 text-xs mt-1">{fieldStates.category.error}</p>
            )}
            {fieldStates.category.touched && fieldStates.category.valid && (
              <p className="text-green-500 text-xs mt-1">✓ Valid category</p>
            )}
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="number"
                step="1"
                min="0"
                className={`w-full p-3 rounded-xl bg-white/5 text-white border transition-colors ${
                  fieldStates.quantity.touched
                    ? fieldStates.quantity.valid
                      ? "border-green-500 bg-green-500/5"
                      : "border-red-500 bg-red-500/5"
                    : "border-white/10"
                }`}
                placeholder="Quantity"
                required
                value={quantity}
                onChange={(e) => handleChange("quantity", e.target.value)}
                onBlur={(e) => handleBlur("quantity", e.target.value)}
                disabled={isSubmitting}
              />
              {fieldStates.quantity.touched && fieldStates.quantity.error && (
                <p className="text-red-500 text-xs mt-1">{fieldStates.quantity.error}</p>
              )}
              {fieldStates.quantity.touched && fieldStates.quantity.valid && (
                <p className="text-green-500 text-xs mt-1">✓ Valid quantity</p>
              )}
            </div>
            <select
              className="w-24 p-3 rounded-xl bg-gray-800 text-white border border-white/10 focus:outline-none"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              disabled={isSubmitting}
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
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid() || isSubmitting}
              className="px-6 py-2 rounded-xl bg-[#FF512F] text-white font-bold cursor-pointer hover:bg-[#FF512F]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Adding..." : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* =========================
   RESTOCK CONFIRMATION MODAL
========================= */
interface RestockConfirmModalProps {
  item: InventoryItem;
  onClose: () => void;
  onConfirm: () => void;
}

const RestockConfirmModal: React.FC<RestockConfirmModalProps> = ({ item, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-white/10">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20">
            <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Restock Inventory Item</h3>
          <p className="text-gray-400 text-sm">
            Are you sure you want to restock <span className="text-white font-semibold">{item.name}</span>?
          </p>
          <p className="text-gray-500 text-xs mt-1">Current quantity: {item.quantity} {item.unit}</p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-600/80 transition-colors shadow-lg shadow-blue-500/20"
          >
            Continue
          </button>
        </div>
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
  onSave: (id: string, quantity: number) => Promise<boolean>;
}

const RestockModal: React.FC<RestockModalProps> = ({ item, onClose, onSave }) => {
  const [quantity, setQuantity] = useState<string>(item.quantity.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldState, setFieldState] = useState({ touched: false, valid: true, error: "" });

  const handleBlur = () => {
    const error = validateQuantity(quantity);
    setFieldState({ touched: true, valid: !error, error });
  };

  const handleChange = (value: string) => {
    setQuantity(value);
    handleBlur();
  };

  const handleSubmit = async () => {
    const error = validateQuantity(quantity);
    setFieldState({ touched: true, valid: !error, error });

    if (error) {
      toast.error(error);
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await onSave(item.id, parseFloat(quantity));
      if (success) {
        toast.success("Inventory updated successfully!");
        onClose();
      }
    } catch (error) {
      console.error("Error updating inventory:", error);
      toast.error("Failed to update inventory");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-white/10">
        <h3 className="text-lg font-bold text-white mb-4">
          Update Stock – {item.name}
        </h3>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <input
              type="number"
              step="1"
              min="0"
              className={`w-full p-3 rounded-xl bg-white/5 text-white border transition-colors ${
                fieldState.touched
                  ? fieldState.valid
                    ? "border-green-500 bg-green-500/5"
                    : "border-red-500 bg-red-500/5"
                  : "border-white/10"
              }`}
              placeholder="Enter quantity"
              value={quantity}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={handleBlur}
              disabled={isSubmitting}
            />
            {fieldState.touched && fieldState.error && (
              <p className="text-red-500 text-xs mt-1">{fieldState.error}</p>
            )}
          </div>
          <span className="text-gray-400 font-bold">{item.unit}</span>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-400 hover:text-white cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!fieldState.valid || isSubmitting}
            className="px-6 py-2 rounded-xl bg-blue-600 text-white font-bold cursor-pointer hover:bg-blue-600/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================
   DELETE CONFIRMATION MODAL
========================= */
interface DeleteConfirmModalProps {
  item: InventoryItem;
  onClose: () => void;
  onConfirm: (id: string) => Promise<boolean>;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ item, onClose, onConfirm }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      const success = await onConfirm(item.id);
      if (success) {
        toast.success("Item deleted successfully!");
        onClose();
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-white/10">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Delete Inventory Item</h3>
          <p className="text-gray-400 text-sm">
            Are you sure you want to delete <span className="text-white font-semibold">{item.name}</span>?
          </p>
          <p className="text-gray-500 text-xs mt-1">This action cannot be undone.</p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-6 py-3 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Deleting..." : "Delete Item"}
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
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);
  const [showRestockConfirm, setShowRestockConfirm] = useState(false);

  /* ===== FETCH INVENTORY ===== */
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/inventory");

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Server error: ${res.status}`);
        }

        const data = await res.json();

        setItems(
          Array.isArray(data) ? data.map((item: any) => ({
            id: item._id,
            name: item.name,
            category: item.category,
            quantity: typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity) || 0,
            unit: item.unit || "pcs",
            status: item.status,
            lastUpdated: new Date(item.updatedAt).toLocaleString(),
          })) : []
        );
      } catch (error) {
        console.error('Error fetching inventory:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to load inventory');
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  /* ===== STATUS STYLES ===== */
  const getStatusStyle = (status: InventoryStatus) => {
    switch (status) {
      case InventoryStatus.IN_STOCK:
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case InventoryStatus.LOW_STOCK:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case InventoryStatus.OUT_OF_STOCK:
        return "bg-red-500/20 text-red-400 border-red-500/30";
    }
  };

  /* ===== ADD ITEM ===== */
  const handleAddItem = async (item: {
    name: string;
    category: string;
    quantity: number;
    unit: string;
  }): Promise<boolean> => {
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || `Server error: ${res.status}`);
      }

      const data = await res.json();

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

      return true;
    } catch (error) {
      console.error('Error adding item:', error);
      throw error;
    }
  };

  /* ===== RESTOCK ===== */
  const handleRestock = async (id: string, quantity: number): Promise<boolean> => {
    try {
      const currentQuantity = items.find(i => i.id === id)?.quantity || 0;
      const quantityDiff = quantity - currentQuantity;

      const res = await fetch("/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          quantity: quantityDiff,
          status: quantity > 0 ? InventoryStatus.IN_STOCK : InventoryStatus.OUT_OF_STOCK
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${res.status}`);
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

      return true;
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw error;
    }
  };

  /* ===== DELETE ===== */
  const handleDelete = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/inventory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${res.status}`);
      }

      setItems((prev) => prev.filter((item) => item.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  };

  return (
    <div className="p-6">
      {addOpen && (
        <AddItemModal onClose={() => setAddOpen(false)} onSave={handleAddItem} />
      )}

      {showRestockConfirm && restockItem && (
        <RestockConfirmModal
          item={restockItem}
          onClose={() => {
            setShowRestockConfirm(false);
            setRestockItem(null);
          }}
          onConfirm={() => {
            setShowRestockConfirm(false);
          }}
        />
      )}

      {restockItem && !showRestockConfirm && (
        <RestockModal
          item={restockItem}
          onClose={() => setRestockItem(null)}
          onSave={handleRestock}
        />
      )}

      {deleteItem && (
        <DeleteConfirmModal
          item={deleteItem}
          onClose={() => setDeleteItem(null)}
          onConfirm={handleDelete}
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
              <th className="p-4 text-right">Actions</th>
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
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setRestockItem(item);
                          setShowRestockConfirm(true);
                        }}
                        className="px-3 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm cursor-pointer transition-colors border border-blue-500/20"
                      >
                        Restock
                      </button>
                      <button
                        onClick={() => setDeleteItem(item)}
                        className="px-3 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm cursor-pointer transition-colors border border-red-500/20"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="text-gray-400 mb-4">No inventory items found</p>
                    <button
                      onClick={() => setAddOpen(true)}
                      className="px-6 py-2 rounded-xl bg-[#FF512F] text-white font-bold cursor-pointer hover:bg-[#FF512F]/80 transition-colors"
                    >
                      Add Your First Item
                    </button>
                  </div>
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
