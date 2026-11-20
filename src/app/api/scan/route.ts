import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  calculateEcoLoopReward,
  normalizeMaterialCategory,
} from "@/lib/rewards";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { getAuthenticatedUser } from "@/lib/auth";

interface ScanRequestBody {
  cardId?: string;
  materialType?: string;
  subtype?: string;
  weightGrams?: number;
  weightKg?: number;
  confidenceScore?: number;
  kioskLocation?: string;
  isVerified?: boolean;
  submissionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ScanRequestBody;

    await connectDB();

    // Prioritize authenticated session if user is logged in; otherwise fall back to cardId
    const authUser = await getAuthenticatedUser(request);
    let resolvedUser = authUser;
    const cardId = authUser?.cardId || body.cardId?.trim().toUpperCase() || "GUEST-DEMO";

    if (!resolvedUser && cardId !== "GUEST-DEMO") {
      resolvedUser = await User.findOne({ cardId });
    }

    const rawMaterial = body.materialType ?? "general";
    const kioskLocation = body.kioskLocation?.trim() || "Dhanmondi 27, Dhaka";
    const submissionId = body.submissionId?.trim();

    // 1. Idempotency Check: Prevent duplicate reward crediting from repeated requests
    if (submissionId) {
      const existingTx = await Transaction.findOne({ submissionId }).lean();
      if (existingTx) {
        return NextResponse.json(
          {
            ok: true,
            isDuplicate: true,
            message: "Submission was already processed and credited.",
            transaction: existingTx,
          },
          { status: 200 }
        );
      }
    }

    // Determine weight in grams (support weightGrams or weightKg)
    let weightGrams: number | undefined = undefined;
    if (typeof body.weightGrams === "number") {
      weightGrams = body.weightGrams;
    } else if (typeof body.weightKg === "number") {
      weightGrams = Math.round(body.weightKg * 1000);
    }

    const rawConfidence =
      typeof body.confidenceScore === "number" && Number.isFinite(body.confidenceScore)
        ? body.confidenceScore
        : 0;

    // 2. Server-side reward calculation & fraud validation
    // NEVER trust a reward amount sent from the browser!
    const calculation = calculateEcoLoopReward({
      material: rawMaterial,
      subtype: body.subtype,
      confidenceScore: rawConfidence,
      manualWeightGrams: weightGrams,
      isVerified: body.isVerified,
      submissionId,
    });

    if (!calculation.success) {
      return NextResponse.json(
        {
          ok: false,
          error: calculation.reason || "Waste deposit validation failed",
          calculation,
        },
        { status: 400 }
      );
    }

    // 3. Persist Transaction in MongoDB
    const transaction = await Transaction.create({
      userId: resolvedUser?._id,
      cardId,
      kioskLocation,
      materialType: calculation.material,
      subtype: calculation.subtype,
      subtypeLabel: calculation.subtypeName,
      confidenceScore: calculation.confidenceScore,
      estimatedWeightGrams: calculation.estimatedWeightGrams,
      weightKg: calculation.estimatedWeightGrams / 1000,
      rewardRatePerKg: calculation.rewardRatePerKg,
      rewardEarnedBdt: calculation.rewardBdt,
      ecoPointsEarned: calculation.ecoPoints,
      submissionId,
      transactionStatus: calculation.requiresReview ? "pending_review" : "credited",
      verificationStatus: calculation.verificationStatus,
    });

    // 4. Update User wallet balance & EcoPoints (if registered user)
    let updatedUser = null;
    if (resolvedUser && calculation.eligible && calculation.ecoPoints > 0) {
      updatedUser = await User.findByIdAndUpdate(
        resolvedUser._id,
        {
          $inc: {
            balanceBdt: calculation.rewardBdt,
            ecoPoints: calculation.ecoPoints,
            totalItemsRecycled: calculation.material === "general" ? 0 : 1,
          },
        },
        { new: true }
      ).lean();
    } else if (resolvedUser) {
      updatedUser = await User.findById(resolvedUser._id).lean();
    }

    return NextResponse.json(
      {
        ok: true,
        transaction,
        calculation,
        routing: {
          material: calculation.material,
          subtype: calculation.subtype,
          label: calculation.subtypeName,
          binName: calculation.binName,
          estimatedWeightGrams: calculation.estimatedWeightGrams,
          rewardRatePerKg: calculation.rewardRatePerKg,
          rewardEarnedBdt: calculation.rewardBdt,
          ecoPointsEarned: calculation.ecoPoints,
          confidenceScore: calculation.confidenceScore,
          isEstimate: calculation.isEstimate,
          eligible: calculation.eligible,
          reason: calculation.reason,
        },
        user: updatedUser
          ? {
              name: updatedUser.name,
              cardId: updatedUser.cardId,
              balanceBdt: updatedUser.balanceBdt,
              ecoPoints: updatedUser.ecoPoints ?? Math.round((updatedUser.balanceBdt ?? 0) * 100),
              reservedEcoPoints: updatedUser.reservedEcoPoints ?? 0,
              availablePoints: Math.max(
                0,
                (updatedUser.ecoPoints ?? 0) - (updatedUser.reservedEcoPoints ?? 0)
              ),
              totalItemsRecycled: updatedUser.totalItemsRecycled,
            }
          : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/scan error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to process waste scan and reward crediting",
      },
      { status: 500 }
    );
  }
}
