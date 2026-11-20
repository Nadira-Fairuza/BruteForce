import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Redemption from "@/models/Redemption";
import {
  getAuthenticatedUser,
  verifyPassword,
  hashPassword,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // 1. Fetch user's individual recycling transactions
    const transactions = await Transaction.find({
      $or: [{ userId: user._id }, { cardId: user.cardId }],
    })
      .sort({ createdAt: -1 })
      .limit(25)
      .lean();

    // 2. Fetch user's redemption history
    const redemptions = await Redemption.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(25)
      .lean();

    // 3. Compute aggregate statistics
    const totalWeightGrams = transactions.reduce(
      (sum, tx) => sum + (tx.estimatedWeightGrams || (tx.weightKg ? tx.weightKg * 1000 : 0)),
      0
    );

    const availablePoints = Math.max(0, (user.ecoPoints ?? 0) - (user.reservedEcoPoints ?? 0));
    const totalPointsEarned = (user.ecoPoints ?? 0) + (user.totalPointsRedeemed ?? 0);

    return NextResponse.json({
      ok: true,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        phone: user.phone,
        cardId: user.cardId,
        role: user.role ?? "citizen",
        ecoPoints: user.ecoPoints ?? 0,
        reservedEcoPoints: user.reservedEcoPoints ?? 0,
        availablePoints,
        balanceBdt: user.balanceBdt ?? 0,
        totalPointsEarned,
        totalPointsRedeemed: user.totalPointsRedeemed ?? 0,
        totalItemsRecycled: user.totalItemsRecycled ?? 0,
        totalWeightKg: Math.round((totalWeightGrams / 1000) * 100) / 100,
        createdAt: user.createdAt,
      },
      transactions,
      redemptions,
    });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // 1. Password change request
    if (body.newPassword) {
      const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
      const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { ok: false, error: "Current password and new password are both required." },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { ok: false, error: "New password must be at least 6 characters long." },
          { status: 400 }
        );
      }

      // Load user with password
      const fullUser = await User.findById(user._id).select("+password");
      if (!fullUser || !fullUser.password || !verifyPassword(currentPassword, fullUser.password)) {
        return NextResponse.json(
          { ok: false, error: "Incorrect current password." },
          { status: 400 }
        );
      }

      fullUser.password = hashPassword(newPassword);
      await fullUser.save();

      return NextResponse.json({
        ok: true,
        message: "Password changed successfully.",
      });
    }

    // 2. Profile information update (name, phone)
    const updates: Partial<{ name: string; phone: string }> = {};
    if (typeof body.name === "string" && body.name.trim()) {
      updates.name = body.name.trim();
    }
    if (typeof body.phone === "string" && body.phone.trim()) {
      updates.phone = body.phone.trim();
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: updates },
      { new: true }
    ).lean();

    return NextResponse.json({
      ok: true,
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("PUT /api/auth/me error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
