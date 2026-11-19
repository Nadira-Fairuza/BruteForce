import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  getRewardForMaterial,
  MATERIAL_RULES,
  normalizeMaterial,
} from "@/lib/rewards";
import Transaction from "@/models/Transaction";
import User from "@/models/User";

interface ScanRequestBody {
  cardId?: string;
  materialType?: string;
  confidenceScore?: number;
  kioskLocation?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ScanRequestBody;

    const rawMaterial = body.materialType ?? "general";
    const material = normalizeMaterial(rawMaterial);
    const confidenceScore =
      typeof body.confidenceScore === "number" && Number.isFinite(body.confidenceScore)
        ? Math.max(0, Math.min(1, body.confidenceScore))
        : 0.9;

    const cardId = body.cardId?.trim().toUpperCase() || "GUEST-DEMO";
    const kioskLocation = body.kioskLocation?.trim() || "Dhanmondi 27, Dhaka";
    const rewardEarnedBdt = getRewardForMaterial(material, confidenceScore);
    const binInfo = MATERIAL_RULES[material];

    await connectDB();

    const transaction = await Transaction.create({
      cardId,
      kioskLocation,
      materialType: material,
      confidenceScore,
      rewardEarnedBdt,
    });

    let updatedUser = null;
    if (cardId !== "GUEST-DEMO") {
      updatedUser = await User.findOneAndUpdate(
        { cardId },
        {
          $inc: {
            balanceBdt: rewardEarnedBdt,
            totalItemsRecycled: material === "general" ? 0 : 1,
          },
        },
        { new: true }
      ).lean();
    }

    return NextResponse.json(
      {
        ok: true,
        transaction,
        routing: {
          material,
          label: binInfo.label,
          binName: binInfo.binName,
          rewardEarnedBdt,
        },
        user: updatedUser
          ? {
              name: updatedUser.name,
              cardId: updatedUser.cardId,
              balanceBdt: updatedUser.balanceBdt,
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
        error: "Failed to process trash scan",
      },
      { status: 500 }
    );
  }
}