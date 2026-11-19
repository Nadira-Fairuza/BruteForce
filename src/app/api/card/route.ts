import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

interface RegisterCardBody {
  name?: string;
  phone?: string;
  cardId?: string;
}

function generateCardId(): string {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `ECO-${randomDigits}`;
}

export async function GET(request: NextRequest) {
  try {
    const rawCardId = request.nextUrl.searchParams.get("cardId")?.trim().toUpperCase();

    await connectDB();

    // If no cardId is passed, return recent cards/users for quick demo switching
    if (!rawCardId) {
      const users = await User.find({})
        .sort({ balanceBdt: -1, createdAt: -1 })
        .limit(20)
        .lean();

      return NextResponse.json({
        ok: true,
        users,
      });
    }

    const user = await User.findOne({ cardId: rawCardId }).lean();
    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          error: `EcoCard "${rawCardId}" was not found`,
        },
        { status: 404 }
      );
    }

    const transactions = await Transaction.find({ cardId: rawCardId })
      .sort({ createdAt: -1 })
      .limit(25)
      .lean();

    return NextResponse.json({
      ok: true,
      user,
      transactions,
    });
  } catch (error) {
    console.error("GET /api/card error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to fetch EcoCard details",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegisterCardBody;

    const name = body.name?.trim();
    const phone = body.phone?.trim();

    if (!name || !phone) {
      return NextResponse.json(
        {
          ok: false,
          error: "Both name and phone number are required to issue an EcoCard",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Use provided cardId if supplied, otherwise generate a unique ECO-XXXXXX ID
    let cardId = body.cardId?.trim().toUpperCase() || generateCardId();

    if (!body.cardId) {
      let exists = await User.exists({ cardId });
      let attempts = 0;
      while (exists && attempts < 5) {
        cardId = generateCardId();
        exists = await User.exists({ cardId });
        attempts += 1;
      }
    } else {
      const existing = await User.findOne({ cardId }).lean();
      if (existing) {
        return NextResponse.json(
          {
            ok: false,
            error: `Card ID "${cardId}" is already registered`,
          },
          { status: 409 }
        );
      }
    }

    const user = await User.create({
      name,
      phone,
      cardId,
      balanceBdt: 0,
      totalItemsRecycled: 0,
    });

    return NextResponse.json(
      {
        ok: true,
        user,
        transactions: [],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/card error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to register EcoCard",
      },
      { status: 500 }
    );
  }
}