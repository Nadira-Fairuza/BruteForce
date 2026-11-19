import mongoose, { Schema, Model, Document } from "mongoose";

export type TrashMaterial = "plastic" | "metal" | "paper" | "general";

export interface ITransaction extends Document {
  cardId: string;
  kioskLocation: string;
  materialType: TrashMaterial;
  confidenceScore: number;
  rewardEarnedBdt: number;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    cardId: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    kioskLocation: {
      type: String,
      default: "Dhanmondi 27, Dhaka",
      trim: true,
    },
    materialType: {
      type: String,
      enum: ["plastic", "metal", "paper", "general"],
      required: true,
    },
    confidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    rewardEarnedBdt: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;