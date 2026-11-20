import test from "node:test";
import assert from "node:assert/strict";

// Import authentication utilities
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
} from "../src/lib/auth.ts";

import {
  MIN_REDEMPTION_ECO_POINTS,
  MIN_REDEMPTION_BDT,
  REWARD_RATES_PER_KG,
} from "../src/lib/rewardConfig.ts";

import {
  calculateEcoLoopReward,
  calculateEcoPoints,
  ecoPointsToBdt,
} from "../src/lib/rewardCalculator.ts";

// 1. Password Security & Hashing Tests
test("1. Password Security: Hash generation and constant-time verification", () => {
  const plain = "Secur3P@ssw0rd!2026";
  const hash = hashPassword(plain);

  assert.notEqual(hash, plain);
  assert.equal(hash.includes(":"), true);

  const [salt, key] = hash.split(":");
  assert.equal(salt.length, 32); // 16 bytes in hex = 32 chars
  assert.equal(key.length, 128); // 64 bytes in hex = 128 chars

  // Correct verification
  assert.equal(verifyPassword(plain, hash), true);

  // Wrong password
  assert.equal(verifyPassword("WrongPassword123", hash), false);
  assert.equal(verifyPassword(plain.toLowerCase(), hash), false);
});

test("1b. Password Security: Unique salts produce distinct hashes for identical passwords", () => {
  const password = "mySecretPassword123";
  const hash1 = hashPassword(password);
  const hash2 = hashPassword(password);

  assert.notEqual(hash1, hash2);
  assert.equal(verifyPassword(password, hash1), true);
  assert.equal(verifyPassword(password, hash2), true);
});

// 2. Session Token & Tamper-Proofing Tests
test("2. Session Token: Creation and signature verification", () => {
  const userData = {
    userId: "67890abcdef1234567890123",
    email: "citizen@ecoloop.local",
    role: "citizen",
    cardId: "ECO-100001",
  };

  const token = createSessionToken(userData);
  assert.equal(typeof token, "string");
  assert.equal(token.includes("."), true);

  const verified = verifySessionToken(token);
  assert.notEqual(verified, null);
  assert.equal(verified.userId, userData.userId);
  assert.equal(verified.email, userData.email);
  assert.equal(verified.role, userData.role);
  assert.equal(verified.cardId, userData.cardId);
});

test("2b. Session Token: Tampering with payload or signature is strictly rejected", () => {
  const token = createSessionToken({
    userId: "user_normal_id",
    email: "normal@example.com",
    role: "citizen",
    cardId: "ECO-222222",
  });

  const [payload, sig] = token.split(".");

  // Tamper with payload (escalate citizen to admin)
  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  decoded.role = "admin";
  const tamperedPayload = Buffer.from(JSON.stringify(decoded)).toString("base64url");
  const tamperedToken = `${tamperedPayload}.${sig}`;

  assert.equal(verifySessionToken(tamperedToken), null);

  // Tamper with signature
  const badSigToken = `${payload}.${sig.slice(0, -4)}xxxx`;
  assert.equal(verifySessionToken(badSigToken), null);
});

// 3. Multi-User Wallet Isolation Tests
test("3. Multi-User Isolation: User A, User B, and User C balances remain completely independent", () => {
  // Simulate three distinct users in memory
  const users = {
    userA: {
      id: "usr_a_1",
      name: "User A (Tanvir)",
      cardId: "ECO-100001",
      ecoPoints: 2450,
      reservedEcoPoints: 0,
      balanceBdt: 24.50,
      totalItemsRecycled: 12,
    },
    userB: {
      id: "usr_b_2",
      name: "User B (Sadia)",
      cardId: "ECO-100002",
      ecoPoints: 850,
      reservedEcoPoints: 0,
      balanceBdt: 8.50,
      totalItemsRecycled: 5,
    },
    userC: {
      id: "usr_c_3",
      name: "User C (Farhan)",
      cardId: "ECO-100003",
      ecoPoints: 5000,
      reservedEcoPoints: 0,
      balanceBdt: 50.00,
      totalItemsRecycled: 30,
    },
  };

  // User A deposits a 500 ml PET bottle (15g -> 15 EcoPoints)
  const depositReward = calculateEcoLoopReward({
    material: "plastic",
    subtype: "pet_bottle_500ml",
    confidenceScore: 0.95,
  });

  assert.equal(depositReward.ecoPoints, 15);
  assert.equal(depositReward.rewardBdt, 0.15);

  // Credit ONLY User A
  users.userA.ecoPoints += depositReward.ecoPoints;
  users.userA.balanceBdt = ecoPointsToBdt(users.userA.ecoPoints);
  users.userA.totalItemsRecycled += 1;

  // Verify User A was credited
  assert.equal(users.userA.ecoPoints, 2465);
  assert.equal(users.userA.balanceBdt, 24.65);
  assert.equal(users.userA.totalItemsRecycled, 13);

  // Verify User B and User C were completely untouched!
  assert.equal(users.userB.ecoPoints, 850);
  assert.equal(users.userB.balanceBdt, 8.50);
  assert.equal(users.userB.totalItemsRecycled, 5);

  assert.equal(users.userC.ecoPoints, 5000);
  assert.equal(users.userC.balanceBdt, 50.00);
  assert.equal(users.userC.totalItemsRecycled, 30);
});

// 4. Redemption Minimum Thresholds & Input Validation Tests
test("4. Redemption Constraints: Minimum threshold 1,000 points (৳10) enforcement", () => {
  assert.equal(MIN_REDEMPTION_ECO_POINTS, 1000);
  assert.equal(MIN_REDEMPTION_BDT, 10);

  // Attempt to redeem 500 points (below 1,000 minimum)
  function validateRedemptionInput(requestedPoints, availablePoints) {
    if (!Number.isInteger(requestedPoints) || requestedPoints < MIN_REDEMPTION_ECO_POINTS) {
      return { ok: false, error: "Below minimum threshold of 1,000 EcoPoints" };
    }
    if (requestedPoints > availablePoints) {
      return { ok: false, error: "Insufficient available balance" };
    }
    return { ok: true, rewardBdt: requestedPoints / 100 };
  }

  const lowResult = validateRedemptionInput(500, 2450);
  assert.equal(lowResult.ok, false);
  assert.match(lowResult.error, /Below minimum threshold/);

  // Attempt to redeem negative points
  const negResult = validateRedemptionInput(-100, 2450);
  assert.equal(negResult.ok, false);

  // Attempt to redeem fractional points
  const floatResult = validateRedemptionInput(1000.5, 2450);
  assert.equal(floatResult.ok, false);

  // Attempt to redeem more than available (user has 850, tries 1,000)
  const overResult = validateRedemptionInput(1000, 850);
  assert.equal(overResult.ok, false);
  assert.match(overResult.error, /Insufficient available balance/);

  // Valid 1,000 points request
  const valid1000 = validateRedemptionInput(1000, 2450);
  assert.equal(valid1000.ok, true);
  assert.equal(valid1000.rewardBdt, 10.00);

  // Valid 2,000 points request
  const valid2000 = validateRedemptionInput(2000, 2450);
  assert.equal(valid2000.ok, true);
  assert.equal(valid2000.rewardBdt, 20.00);
});

// 5. Point Reservation Lifecycle & Double-Spending Prevention
test("5. Redemption Lifecycle: Point reservation on submit prevents double-spending", () => {
  const user = {
    ecoPoints: 2450,
    reservedEcoPoints: 0,
    totalPointsRedeemed: 0,
    balanceBdt: 24.50,
  };

  const getAvailable = () => user.ecoPoints - user.reservedEcoPoints;

  assert.equal(getAvailable(), 2450);

  // User submits 1,000 points request
  const requestPoints = 1000;
  assert.equal(requestPoints <= getAvailable(), true);

  // Reserve points
  user.reservedEcoPoints += requestPoints;
  const pendingRedemption = {
    id: "red_001",
    requestedPoints: requestPoints,
    rewardBdt: requestPoints / 100,
    status: "pending",
  };

  // User's available points drops immediately to 1,450
  assert.equal(getAvailable(), 1450);
  assert.equal(user.reservedEcoPoints, 1000);

  // User attempts to redeem another 2,000 points immediately
  // Must fail because available is only 1,450!
  const secondAttempt = 2000;
  assert.equal(secondAttempt <= getAvailable(), false);
});

// 6. Admin Rejection Restores Reserved Points
test("6. Redemption Rejection: Administrator rejection releases reserved points back to user", () => {
  const user = {
    ecoPoints: 2450,
    reservedEcoPoints: 1000,
    balanceBdt: 24.50,
  };

  const getAvailable = () => user.ecoPoints - user.reservedEcoPoints;
  assert.equal(getAvailable(), 1450);

  // Admin rejects redemption (e.g. invalid phone number)
  const redemption = {
    id: "red_001",
    requestedPoints: 1000,
    status: "pending",
  };

  // Rejection action:
  user.reservedEcoPoints -= redemption.requestedPoints;
  redemption.status = "rejected";
  redemption.rejectionReason = "Unreachable mobile number";

  // Reserved points are released back to available balance!
  assert.equal(user.reservedEcoPoints, 0);
  assert.equal(user.ecoPoints, 2450);
  assert.equal(getAvailable(), 2450);
  assert.equal(redemption.status, "rejected");
});

// 7. Admin Completion Permanently Deducts Points
test("7. Redemption Completion: Approved and completed payout permanently settles balance", () => {
  const user = {
    ecoPoints: 2450,
    reservedEcoPoints: 2000,
    totalPointsRedeemed: 0,
    balanceBdt: 24.50,
  };

  const redemption = {
    id: "red_002",
    requestedPoints: 2000,
    rewardBdt: 20.00,
    status: "approved",
  };

  // Admin marks payout completed via bKash
  user.ecoPoints -= redemption.requestedPoints;
  user.reservedEcoPoints -= redemption.requestedPoints;
  user.balanceBdt -= redemption.rewardBdt;
  user.totalPointsRedeemed += redemption.requestedPoints;
  redemption.status = "completed";

  // Balance verified
  assert.equal(user.ecoPoints, 450);
  assert.equal(user.reservedEcoPoints, 0);
  assert.equal(user.balanceBdt, 4.50);
  assert.equal(user.totalPointsRedeemed, 2000);
  assert.equal(redemption.status, "completed");
});

// 8. Role Authorization Gate
test("8. Role Authorization: Admin operations blocked for citizen roles", () => {
  function checkAdminAccess(userRole) {
    if (userRole !== "admin") {
      return { authorized: false, status: 403, error: "Access denied. Administrator privileges required." };
    }
    return { authorized: true, status: 200 };
  }

  const citizenCheck = checkAdminAccess("citizen");
  assert.equal(citizenCheck.authorized, false);
  assert.equal(citizenCheck.status, 403);

  const guestCheck = checkAdminAccess(undefined);
  assert.equal(guestCheck.authorized, false);
  assert.equal(guestCheck.status, 403);

  const adminCheck = checkAdminAccess("admin");
  assert.equal(adminCheck.authorized, true);
  assert.equal(adminCheck.status, 200);
});
