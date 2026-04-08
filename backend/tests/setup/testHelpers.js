import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../../src/models/User.js";
import Household from "../../src/models/Household.js";

export async function createTestUser(overrides = {}) {
  // Create a lightweight authenticated user fixture for route tests.
  return User.create({
    name: "Test User",
    email: `user-${new mongoose.Types.ObjectId()}@example.com`,
    password: "hashed-password",
    role: "user",
    ...overrides,
  });
}

export function createAuthHeader(userId) {
  // Mirror the app's Bearer-token format so protected routes can be called in integration tests.
  const token = jwt.sign({ id: userId.toString() }, process.env.JWT_SECRET);
  return `Bearer ${token}`;
}

export async function createTestHousehold(userId, overrides = {}) {
  // Create an owned household fixture so user-scoped usage and billing routes can pass ownership checks.
  return Household.create({
    userId,
    name: "Test Household",
    city: "Colombo",
    occupants: 3,
    ...overrides,
  });
}
