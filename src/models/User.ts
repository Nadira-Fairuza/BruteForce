import mongoose, { Schema, Model, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  phone: string;
  email?: string;
  password?: string;
  role: "citizen" | "admin";
  cardId: string;
  balanceBdt: number;
  ecoPoints?: number;
  reservedEcoPoints?: number;
  totalPointsRedeemed?: number;
  totalItemsRecycled: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: ["citizen", "admin"],
      default: "citizen",
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    cardId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    balanceBdt: {
      type: Number,
      default: 0,
      min: 0,
    },
    ecoPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    reservedEcoPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPointsRedeemed: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalItemsRecycled: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
