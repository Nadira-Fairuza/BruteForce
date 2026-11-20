import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import {
  hashPassword,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth";

function generateCardId(): string {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `ECO-${randomDigits}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";

    // 1. Validation
    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { ok: false, error: "Name, email, password, and password confirmation are required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { ok: false, error: "Passwords do not match." },
        { status: 400 }
      );
    }

    await connectDB();

    // 2. Check duplicate email
    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return NextResponse.json(
        { ok: false, error: "An account with this email address already exists. Please log in." },
        { status: 409 }
      );
    }

    // 3. Generate unique EcoCard ID
    let cardId = generateCardId();
    let attempts = 0;
    while ((await User.exists({ cardId })) && attempts < 5) {
      cardId = generateCardId();
      attempts += 1;
    }

    // 4. Secure password hash
    const hashedPassword = hashPassword(password);

    // 5. Create User
    const newUser = await User.create({
      name,
      email,
      phone: phone || "01700000000",
      password: hashedPassword,
      cardId,
      role: "citizen",
      balanceBdt: 0,
      ecoPoints: 0,
      reservedEcoPoints: 0,
      totalPointsRedeemed: 0,
      totalItemsRecycled: 0,
    });

    // 6. Generate Session Token & Set Cookie
    const sessionToken = createSessionToken({
      userId: String(newUser._id),
      email: newUser.email || email,
      role: newUser.role,
      cardId: newUser.cardId,
    });

    const response = NextResponse.json(
      {
        ok: true,
        message: "Registration successful. Welcome to EcoLoop!",
        user: {
          id: String(newUser._id),
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          cardId: newUser.cardId,
          role: newUser.role,
          ecoPoints: newUser.ecoPoints ?? 0,
          reservedEcoPoints: 0,
          availablePoints: 0,
          balanceBdt: 0,
          totalItemsRecycled: 0,
        },
      },
      { status: 201 }
    );

    response.cookies.set({
      ...sessionCookieOptions,
      value: sessionToken,
    });

    return response;
  } catch (error) {
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to register account. Please try again." },
      { status: 500 }
    );
  }
}
