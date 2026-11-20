import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Redemption from "@/models/Redemption";
import { getAuthenticatedUser } from "@/lib/auth";
import { MIN_REDEMPTION_ECO_POINTS } from "@/lib/rewardConfig";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required to view redemptions." },
        { status: 401 }
      );
    }

    const redemptions = await Redemption.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      ok: true,
      redemptions,
    });
  } catch (error) {
    console.error("GET /api/redemptions error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch redemption history." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required to request a reward redemption." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const requestedPoints = Number(body.requestedPoints);
    const payoutMethod = body.payoutMethod;
    const payoutAccount = typeof body.payoutAccount === "string" ? body.payoutAccount.trim() : "";

    // 1. Validation
    if (!Number.isInteger(requestedPoints) || requestedPoints < MIN_REDEMPTION_ECO_POINTS) {
      return NextResponse.json(
        {
          ok: false,
          error: `Minimum redemption threshold is ${MIN_REDEMPTION_ECO_POINTS.toLocaleString()} EcoPoints (৳${(
            MIN_REDEMPTION_ECO_POINTS / 100
          ).toFixed(2)}).`,
        },
        { status: 400 }
      );
    }

    const validMethods = ["bKash", "Nagad", "Mobile Recharge"];
    if (!validMethods.includes(payoutMethod)) {
      return NextResponse.json(
        { ok: false, error: "Invalid payout method. Please choose bKash, Nagad, or Mobile Recharge." },
        { status: 400 }
      );
    }

    if (!payoutAccount || payoutAccount.length < 8) {
      return NextResponse.json(
        { ok: false, error: "Please provide a valid account or mobile number for payout." },
        { status: 400 }
      );
    }

    // 2. Fetch fresh user document to ensure balance integrity
    const freshUser = await User.findById(user._id);
    if (!freshUser) {
      return NextResponse.json({ ok: false, error: "User record not found." }, { status: 404 });
    }

    const currentEcoPoints = freshUser.ecoPoints ?? 0;
    const currentReserved = freshUser.reservedEcoPoints ?? 0;
    const availablePoints = Math.max(0, currentEcoPoints - currentReserved);

    if (requestedPoints > availablePoints) {
      return NextResponse.json(
        {
          ok: false,
          error: `Insufficient available EcoPoints. You have ${availablePoints.toLocaleString()} available (${currentReserved.toLocaleString()} currently reserved).`,
        },
        { status: 400 }
      );
    }

    const rewardBdt = Math.round((requestedPoints / 100) * 100) / 100;

    // 3. Atomically reserve points so they cannot be spent again
    await User.findByIdAndUpdate(user._id, {
      $inc: { reservedEcoPoints: requestedPoints },
    });

    // 4. Create Redemption record
    const redemption = await Redemption.create({
      userId: user._id,
      cardId: freshUser.cardId,
      userName: freshUser.name,
      userEmail: freshUser.email || `${freshUser.cardId.toLowerCase()}@ecoloop.local`,
      requestedPoints,
      rewardBdt,
      payoutMethod,
      payoutAccount,
      status: "pending",
    });

    return NextResponse.json(
      {
        ok: true,
        message: `Redemption request for ${requestedPoints.toLocaleString()} EcoPoints (৳${rewardBdt.toFixed(
          2
        )}) submitted! Points are now reserved pending administrative payout.`,
        redemption,
        newAvailablePoints: availablePoints - requestedPoints,
        newReservedPoints: currentReserved + requestedPoints,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/redemptions error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to submit redemption request." },
      { status: 500 }
    );
  }
}
