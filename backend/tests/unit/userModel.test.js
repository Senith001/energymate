import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import User from "../../src/models/User.js";
import { connectTestDb, disconnectTestDb, clearTestDb } from "../setup/testDb.js";

describe("User Model Unit Tests", () => {
  // We connect to the in-memory DB so we can test the pre('save') ID generation hook
  beforeAll(async () => {
    await connectTestDb();
  });

  afterEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  // --- 1. PURE VALIDATION TESTS (No DB saving required) ---

  it("should successfully validate a user with all required data", () => {
    const validUser = new User({
      name: "Senith Sandeepa",
      email: "senith@example.com",
      password: "HashedPassword123",
    });

    // validateSync() checks the schema rules without saving to the database
    const error = validUser.validateSync();
    expect(error).toBeUndefined();
  });

  it("should fail validation if required fields are missing", () => {
    const invalidUser = new User({}); // Empty object

    const error = invalidUser.validateSync();

    expect(error).toBeDefined();
    expect(error.errors.name).toBeDefined();
    expect(error.errors.email).toBeDefined();
    expect(error.errors.password).toBeDefined();
  });

  it("should set default values for optional fields automatically", () => {
    const user = new User({
      name: "Default Tester",
      email: "default@example.com",
      password: "HashedPassword123",
    });

    expect(user.role).toBe("user");
    expect(user.isVerified).toBe(false);
    expect(user.twoFactorEnabled).toBe(false);
    expect(user.phone).toBe("");
    expect(user.address).toBe("");
  });

  // --- 2. HOOK / SAVE TESTS (Requires DB saving) ---

  it("should auto-generate a userId starting with 'U' for standard users on save", async () => {
    const user = new User({
      name: "Standard User",
      email: "user@example.com",
      password: "HashedPassword123",
      role: "user",
    });

    const savedUser = await user.save();

    expect(savedUser.userId).toBeDefined();
    expect(savedUser.userId).toMatch(/^U\d{3}$/); // Matches U followed by 3 digits (e.g., U001)
  });

  it("should auto-generate a userId starting with 'A' for admins on save", async () => {
    const admin = new User({
      name: "Admin User",
      email: "admin@example.com",
      password: "HashedPassword123",
      role: "admin",
    });

    const savedAdmin = await admin.save();

    expect(savedAdmin.userId).toBeDefined();
    expect(savedAdmin.userId).toMatch(/^A\d{3}$/); // e.g., A001
  });

  it("should auto-generate a userId starting with 'S' for superadmins on save", async () => {
    const superadmin = new User({
      name: "Super Admin",
      email: "super@example.com",
      password: "HashedPassword123",
      role: "superadmin",
    });

    const savedSuperadmin = await superadmin.save();

    expect(savedSuperadmin.userId).toBeDefined();
    expect(savedSuperadmin.userId).toMatch(/^S\d{3}$/); // e.g., S001
  });
});