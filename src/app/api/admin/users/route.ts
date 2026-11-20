import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const admin = await getAuthenticatedUser(request);

    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Access denied. Administrator privileges required." },
        { status: 403 }
      );
    }

    const search = request.nextUrl.searchParams.get("search")?.trim().toLowerCase();
    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { cardId: { $regex: search.toUpperCase(), $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const sanitizedUsers = users.map((u) => ({
      id: String(u._id),
      name: u.name,
      email: u.email || "No email",
      phone: u.phone,
      cardId: u.cardId,
      role: u.role ?? "citizen",
      balanceBdt: u.balanceBdt ?? 0,
      ecoPoints: u.ecoPoints ?? 0,
      reservedEcoPoints: u.reservedEcoPoints ?? 0,
      availablePoints: Math.max(0, (u.ecoPoints ?? 0) - (u.reservedEcoPoints ?? 0)),
      totalPointsRedeemed: u.totalPointsRedeemed ?? 0,
      totalItemsRecycled: u.totalItemsRecycled ?? 0,
      createdAt: u.createdAt,
    }));

    return NextResponse.json({
      ok: true,
      users: sanitizedUsers,
    });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch user directory." },
      { status: 500 }
    );
  }
}
