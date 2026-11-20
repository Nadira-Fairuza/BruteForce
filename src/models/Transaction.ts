import mongoose, { Schema, Model, Document } from "mongoose";

export type TrashMaterial =
  | "plastic"
  | "metal"
  | "paper"
  | "organic"
  | "glass"
  | "ewaste"
  | "general";

export interface ITransaction extends Document {
  userId?: mongoose.Types.ObjectId;
  cardId: string;
  kioskLocation: string;
  materialType: TrashMaterial;
  confidenceScore: number;
  rewardEarnedBdt: number;
  ecoPointsEarned?: number;
  estimatedWeightGrams?: number;
  rewardRatePerKg?: number;
  weightKg?: number;
  subtype?: string;
  subtypeLabel?: string;
  submissionId?: string;
  transactionStatus?: "credited" | "pending_review" | "rejected";
  rateSource?: string;
  rateVersion?: string;
  verificationStatus?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
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
      enum: ["plastic", "metal", "paper", "organic", "glass", "ewaste", "general"],
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
    ecoPointsEarned: {
      type: Number,
      min: 0,
    },
    estimatedWeightGrams: {
      type: Number,
      min: 0,
    },
    rewardRatePerKg: {
      type: Number,
      min: 0,
    },
    weightKg: {
      type: Number,
      min: 0,
    },
    subtype: {
      type: String,
      trim: true,
    },
    subtypeLabel: {
      type: String,
      trim: true,
    },
    submissionId: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    transactionStatus: {
      type: String,
      enum: ["credited", "pending_review", "rejected"],
      default: "credited",
    },
    rateSource: {
      type: String,
      trim: true,
    },
    rateVersion: {
      type: String,
      trim: true,
    },
    verificationStatus: {
      type: String,
      trim: true,
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
