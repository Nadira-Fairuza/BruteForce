import mongoose, { Schema, Model, Document } from "mongoose";

export type RedemptionStatus = "pending" | "approved" | "rejected" | "completed";
export type PayoutMethod = "bKash" | "Nagad" | "Mobile Recharge";

export interface IRedemption extends Document {
  userId: mongoose.Types.ObjectId;
  cardId: string;
  userName: string;
  userEmail: string;
  requestedPoints: number;
  rewardBdt: number;
  payoutMethod: PayoutMethod;
  payoutAccount: string;
  status: RedemptionStatus;
  rejectionReason?: string;
  adminNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RedemptionSchema = new Schema<IRedemption>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    cardId: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    requestedPoints: {
      type: Number,
      required: true,
      min: 1000,
    },
    rewardBdt: {
      type: Number,
      required: true,
      min: 10,
    },
    payoutMethod: {
      type: String,
      enum: ["bKash", "Nagad", "Mobile Recharge"],
      required: true,
    },
    payoutAccount: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    adminNotes: {
      type: String,
      trim: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Redemption: Model<IRedemption> =
  mongoose.models.Redemption ||
  mongoose.model<IRedemption>("Redemption", RedemptionSchema);

export default Redemption;
