import mongoose, { Schema, Document } from "mongoose";

export interface InventoryDoc extends Document {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  status: "In_Stock" | "Low_Stock" | "Out_of_Stock";
  lastUpdated: Date;
}

const InventorySchema = new Schema<InventoryDoc>(
  {
    name: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true, default: 'pcs' },
    status: {
      type: String,
      enum: ["In_Stock", "Low_Stock", "Out_of_Stock"],
      required: true,
      index: true
    },
    lastUpdated: { type: Date, default: Date.now }
  },
  {
    collection: "inventory&stocks",
    timestamps: true
  }
);

export default mongoose.models.Inventory ||
  mongoose.model<InventoryDoc>("Inventory", InventorySchema);
