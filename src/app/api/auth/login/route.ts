import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import {
  verifyPassword,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Both email and password are required." },
        { status: 400 }
      );
    }

    await connectDB();

    // Look up user including password hash
    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.password) {
      return NextResponse.json(
        { ok: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isMatch = verifyPassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { ok: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const availablePoints = Math.max(0, (user.ecoPoints ?? 0) - (user.reservedEcoPoints ?? 0));

    // Create Session Token
    const sessionToken = createSessionToken({
      userId: String(user._id),
      email: user.email || email,
      role: user.role ?? "citizen",
      cardId: user.cardId,
    });

    const response = NextResponse.json({
      ok: true,
      message: `Welcome back, ${user.name}!`,
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
        totalItemsRecycled: user.totalItemsRecycled ?? 0,
        totalPointsRedeemed: user.totalPointsRedeemed ?? 0,
      },
    });

    response.cookies.set({
      ...sessionCookieOptions,
      value: sessionToken,
    });

    return response;
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
