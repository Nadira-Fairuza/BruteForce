import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Redemption from "@/models/Redemption";
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

    const statusParam = request.nextUrl.searchParams.get("status");
    const query: Record<string, unknown> = {};
    if (statusParam && ["pending", "approved", "rejected", "completed"].includes(statusParam)) {
      query.status = statusParam;
    }

    const redemptions = await Redemption.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const pendingCount = await Redemption.countDocuments({ status: "pending" });
    const approvedCount = await Redemption.countDocuments({ status: "approved" });
    const completedCount = await Redemption.countDocuments({ status: "completed" });
    const rejectedCount = await Redemption.countDocuments({ status: "rejected" });

    return NextResponse.json({
      ok: true,
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        completed: completedCount,
        rejected: rejectedCount,
      },
      redemptions,
    });
  } catch (error) {
    console.error("GET /api/admin/redemptions error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch admin redemption records." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const admin = await getAuthenticatedUser(request);

    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Access denied. Administrator privileges required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const redemptionId = body.redemptionId;
    const action = body.action; // "approve" | "reject" | "complete"
    const rejectionReason = typeof body.rejectionReason === "string" ? body.rejectionReason.trim() : "";
    const adminNotes = typeof body.adminNotes === "string" ? body.adminNotes.trim() : "";

    if (!redemptionId || !action) {
      return NextResponse.json(
        { ok: false, error: "Both redemptionId and action are required." },
        { status: 400 }
      );
    }

    const redemption = await Redemption.findById(redemptionId);
    if (!redemption) {
      return NextResponse.json(
        { ok: false, error: "Redemption record not found." },
        { status: 404 }
      );
    }

    const points = redemption.requestedPoints;
    const bdt = redemption.rewardBdt;
    const now = new Date();

    if (action === "approve") {
      if (redemption.status !== "pending") {
        return NextResponse.json(
          { ok: false, error: `Cannot approve request with current status: ${redemption.status}` },
          { status: 400 }
        );
      }

      redemption.status = "approved";
      redemption.reviewedBy = admin._id;
      redemption.reviewedAt = now;
      if (adminNotes) redemption.adminNotes = adminNotes;
      await redemption.save();

      return NextResponse.json({
        ok: true,
        message: "Redemption approved for payout.",
        redemption,
      });
    }

    if (action === "reject") {
      if (redemption.status === "completed" || redemption.status === "rejected") {
        return NextResponse.json(
          { ok: false, error: `Cannot reject request that is already ${redemption.status}.` },
          { status: 400 }
        );
      }

      // Restore reserved points back to user's available balance
      await User.findByIdAndUpdate(redemption.userId, {
        $inc: { reservedEcoPoints: -points },
      });

      redemption.status = "rejected";
      redemption.rejectionReason = rejectionReason || "Rejected by administrator review.";
      redemption.reviewedBy = admin._id;
      redemption.reviewedAt = now;
      if (adminNotes) redemption.adminNotes = adminNotes;
      await redemption.save();

      return NextResponse.json({
        ok: true,
        message: `Redemption rejected. ${points.toLocaleString()} reserved EcoPoints were restored to the user's available balance.`,
        redemption,
      });
    }

    if (action === "complete") {
      if (redemption.status === "completed") {
        return NextResponse.json(
          { ok: false, error: "Redemption has already been completed." },
          { status: 400 }
        );
      }
      if (redemption.status === "rejected") {
        return NextResponse.json(
          { ok: false, error: "Cannot complete a rejected redemption." },
          { status: 400 }
        );
      }

      // Permanently deduct points and BDT, and update totalPointsRedeemed
      await User.findByIdAndUpdate(redemption.userId, {
        $inc: {
          ecoPoints: -points,
          reservedEcoPoints: -points,
          balanceBdt: -bdt,
          totalPointsRedeemed: points,
        },
      });

      redemption.status = "completed";
      redemption.completedAt = now;
      redemption.reviewedBy = admin._id;
      redemption.reviewedAt = now;
      if (adminNotes) redemption.adminNotes = adminNotes;
      await redemption.save();

      return NextResponse.json({
        ok: true,
        message: `Redemption completed! ${points.toLocaleString()} EcoPoints (৳${bdt.toFixed(
          2
        )}) permanently deducted from wallet.`,
        redemption,
      });
    }

    return NextResponse.json(
      { ok: false, error: "Invalid action. Supported: approve, reject, complete." },
      { status: 400 }
    );
  } catch (error) {
    console.error("PATCH /api/admin/redemptions error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to update redemption status." },
      { status: 500 }
    );
  }
}
