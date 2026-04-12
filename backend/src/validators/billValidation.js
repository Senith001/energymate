import { body, param, query } from "express-validator";
import { validate } from "../middlewares/validate.middleware.js";
import { idParamRule } from "./usageValidation.js";

function isFuturePeriod(month, year) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  return Number(year) > currentYear || (Number(year) === currentYear && Number(month) > currentMonth);
}

// Validate the billing inputs needed to create a manual bill or seed a generated one.
const createBillRules = [
  body("householdId")
    .notEmpty().withMessage("householdId is required")
    .isMongoId().withMessage("householdId must be a valid Mongo ID"),
  body("month")
    .notEmpty().withMessage("month is required")
    .isInt({ min: 1, max: 12 }).withMessage("month must be 1-12"),
  body("year")
    .notEmpty().withMessage("year is required")
    .isInt({ min: 2000, max: 2100 }).withMessage("year must be between 2000 and 2100"),
  body("totalUnits")
    .optional()
    .isFloat({ min: 0 }).withMessage("totalUnits must be a non-negative number"),
  body("previousReading")
    .optional()
    .isFloat({ min: 0 }).withMessage("previousReading must be a non-negative number"),
  body("currentReading")
    .optional()
    .isFloat({ min: 0 }).withMessage("currentReading must be a non-negative number"),
  body().custom((value) => {
    if (isFuturePeriod(value.month, value.year)) {
      throw new Error("Billing period cannot be in the future");
    }

    const hasPreviousReading = value.previousReading !== undefined && value.previousReading !== null;
    const hasCurrentReading = value.currentReading !== undefined && value.currentReading !== null;

    if (hasPreviousReading && hasCurrentReading && Number(value.currentReading) < Number(value.previousReading)) {
      throw new Error("currentReading must be >= previousReading");
    }

    return true;
  }),
  validate,
];

// Bill updates can touch payment state or editable calculation inputs on an existing record.
const updateBillRules = [
  param("id").isMongoId().withMessage("Invalid bill ID"),
  body("month")
    .optional()
    .isInt({ min: 1, max: 12 }).withMessage("month must be 1-12"),
  body("year")
    .optional()
    .isInt({ min: 2000, max: 2100 }).withMessage("year must be between 2000 and 2100"),
  body("totalUnits")
    .optional()
    .isFloat({ min: 0 }).withMessage("totalUnits must be a non-negative number"),
  body("previousReading")
    .optional()
    .isFloat({ min: 0 }).withMessage("previousReading must be a non-negative number"),
  body("currentReading")
    .optional()
    .isFloat({ min: 0 }).withMessage("currentReading must be a non-negative number")
    .custom((value, { req }) => {
      if (req.body.previousReading !== undefined && value !== undefined && Number(value) < Number(req.body.previousReading)) {
        throw new Error("currentReading must be >= previousReading");
      }
      return true;
    }),
  body("status")
    .optional()
    .isIn(["unpaid", "paid"]).withMessage("status must be 'unpaid' or 'paid'"),
  body("paidAt")
    .optional({ nullable: true })
    .isISO8601().withMessage("paidAt must be a valid ISO-8601 date"),
  // Keep payment state consistent so paid bills always have a paid date and unpaid bills do not.
  body().custom((value) => {
    const hasStatus = value.status !== undefined;
    const hasPaidAt = value.paidAt !== undefined;

    if (hasStatus && value.status === "paid" && !hasPaidAt) {
      throw new Error("paidAt is required when marking a bill as paid");
    }

    if (hasStatus && value.status === "unpaid" && hasPaidAt && value.paidAt !== null && value.paidAt !== "") {
      throw new Error("paidAt must be cleared when a bill is marked as unpaid");
    }

    return true;
  }),
  body("dueDate")
    .optional()
    .isISO8601().withMessage("dueDate must be a valid ISO-8601 date"),
  body().custom((value) => {
    if (value.month !== undefined && value.year !== undefined && isFuturePeriod(value.month, value.year)) {
      throw new Error("Billing period cannot be in the future");
    }

    return true;
  }),
  validate,
];

const comparisonQueryRules = [
  param("householdId")
    .notEmpty().withMessage("householdId param is required")
    .isMongoId().withMessage("householdId must be a valid Mongo ID"),
  query("month")
    .notEmpty().withMessage("month query param is required")
    .isInt({ min: 1, max: 12 }).withMessage("month must be 1-12"),
  query("year")
    .notEmpty().withMessage("year query param is required")
    .isInt({ min: 2000, max: 2100 }).withMessage("year must be between 2000 and 2100"),
  query().custom((value) => {
    if (isFuturePeriod(value.month, value.year)) {
      throw new Error("Billing period cannot be in the future");
    }
    return true;
  }),
  validate,
];

export {
  createBillRules,
  updateBillRules,
  idParamRule as billIdRule,
  comparisonQueryRules,
};
