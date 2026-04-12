import { body, param, query } from "express-validator";
import { validate } from "../middlewares/validate.middleware.js";
// Validate full usage creation payloads before the controller decides between manual and meter entry flows.
const createUsageRules = [
  body("householdId")
    .notEmpty().withMessage("householdId is required")
    .isMongoId().withMessage("householdId must be a valid Mongo ID"),
  body("date")
    .notEmpty().withMessage("date is required")
    .isISO8601().withMessage("date must be a valid ISO-8601 date"),
  body("entryType")
    .optional()
    .isIn(["manual", "meter"]).withMessage("entryType must be 'manual' or 'meter'"),
  body("unitsUsed")
    .optional()
    .isFloat({ min: 0 }).withMessage("unitsUsed must be a non-negative number"),
  body("previousReading")
    .optional()
    .isFloat({ min: 0 }).withMessage("previousReading must be a non-negative number"),
  body("currentReading")
    .optional()
    .isFloat({ min: 0 }).withMessage("currentReading must be a non-negative number"),

  // Require enough raw input to derive usage, whether the entry is manual or based on meter readings.
  body().custom((value) => {
    const { unitsUsed, previousReading, currentReading } = value;

    const hasUnits = unitsUsed !== undefined && unitsUsed !== null;
    const hasPreviousReading = previousReading !== undefined && previousReading !== null;
    const hasCurrentReading = currentReading !== undefined && currentReading !== null;

    if (!hasUnits && (!hasPreviousReading || !hasCurrentReading)) {
      throw new Error("Provide either unitsUsed OR both previousReading and currentReading");
    }
    return true;
  }),
  validate,
];

// Allow partial usage edits while still validating any numeric fields that are present.
const updateUsageRules = [
  param("id").isMongoId().withMessage("Invalid usage ID"),
  body("date")
    .optional()
    .isISO8601().withMessage("date must be a valid ISO-8601 date"),
  body("entryType")
    .optional()
    .isIn(["manual", "meter"]).withMessage("entryType must be 'manual' or 'meter'"),
  body("unitsUsed")
    .optional()
    .isFloat({ min: 0 }).withMessage("unitsUsed must be a non-negative number"),
  body("previousReading")
    .optional()
    .isFloat({ min: 0 }).withMessage("previousReading must be a non-negative number"),
  body("currentReading")
    .optional()
    .isFloat({ min: 0 }).withMessage("currentReading must be a non-negative number")
    .custom((value, { req }) => {
      // If both readings provided in update, currentReading must be >= previousReading
      if (req.body.previousReading !== undefined && value !== undefined) {
        if (value < req.body.previousReading) {
          throw new Error("currentReading must be >= previousReading");
        }
      }
      return true;
    }),
  validate,
];

// Reuse a single id validator for fetch and delete endpoints that only need the usage record id.
const idParamRule = [
  param("id").isMongoId().withMessage("Invalid ID"),
  validate,
];

// Protect the month/year analytics endpoints from invalid household or period values.
const monthlyQueryRules = [
  param("householdId")
    .notEmpty().withMessage("householdId param is required")
    .isMongoId().withMessage("householdId must be a valid Mongo ID"),
  query("month")
    .notEmpty().withMessage("month query param is required")
    .isInt({ min: 1, max: 12 }).withMessage("month must be 1-12"),
  query("year")
    .notEmpty().withMessage("year query param is required")
    .isInt({ min: 2000, max: 2100 }).withMessage("year must be between 2000 and 2100"),
  validate,
];

// Validate weather insight requests, including optional browser coordinates or custom city fallback.
const weatherImpactRules = [
  param("householdId")
    .notEmpty().withMessage("householdId param is required")
    .isMongoId().withMessage("householdId must be a valid Mongo ID"),
  query("month")
    .notEmpty().withMessage("month query param is required")
    .isInt({ min: 1, max: 12 }).withMessage("month must be 1-12"),
  query("year")
    .notEmpty().withMessage("year query param is required")
    .isInt({ min: 2000, max: 2100 }).withMessage("year must be between 2000 and 2100"),
  query("city")
    .optional()
    .isString().withMessage("city must be a string"),
  query("lat")
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage("lat must be a valid latitude"),
  query("lon")
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage("lon must be a valid longitude"),
  validate,
];

// Appliance-hour logs are daily overrides used by the appliance and room breakdown charts.
const applianceUsageLogCreateRules = [
  param("householdId")
    .notEmpty().withMessage("householdId param is required")
    .isMongoId().withMessage("householdId must be a valid Mongo ID"),
  body("applianceId")
    .notEmpty().withMessage("applianceId is required")
    .isMongoId().withMessage("applianceId must be a valid Mongo ID"),
  body("date")
    .notEmpty().withMessage("date is required")
    .isISO8601().withMessage("date must be a valid ISO-8601 date"),
  body("hoursUsed")
    .notEmpty().withMessage("hoursUsed is required")
    .isFloat({ min: 0, max: 24 }).withMessage("hoursUsed must be between 0 and 24"),
  body("source")
    .optional()
    .isIn(["manual", "default"]).withMessage("source must be 'manual' or 'default'"),
  validate,
];

// Updates only touch the log fields that can change after an appliance-hours entry is created.
const applianceUsageLogUpdateRules = [
  param("householdId")
    .notEmpty().withMessage("householdId param is required")
    .isMongoId().withMessage("householdId must be a valid Mongo ID"),
  param("logId").isMongoId().withMessage("Invalid appliance usage log ID"),
  body("date")
    .optional()
    .isISO8601().withMessage("date must be a valid ISO-8601 date"),
  body("hoursUsed")
    .optional()
    .isFloat({ min: 0, max: 24 }).withMessage("hoursUsed must be between 0 and 24"),
  body("source")
    .optional()
    .isIn(["manual", "default"]).withMessage("source must be 'manual' or 'default'"),
  validate,
];

// Listing rules keep appliance-hour filters predictable for monthly admin and user views.
const applianceUsageLogListRules = [
  param("householdId")
    .notEmpty().withMessage("householdId param is required")
    .isMongoId().withMessage("householdId must be a valid Mongo ID"),
  query("applianceId")
    .optional()
    .isMongoId().withMessage("applianceId must be a valid Mongo ID"),
  query("month")
    .optional()
    .isInt({ min: 1, max: 12 }).withMessage("month must be 1-12"),
  query("year")
    .optional()
    .isInt({ min: 2000, max: 2100 }).withMessage("year must be between 2000 and 2100"),
  // Keep period filters paired so the backend does not guess a partial date range.
  query("year").custom((_, { req }) => {
    if ((req.query.month && !req.query.year) || (!req.query.month && req.query.year)) {
      throw new Error("month and year must be provided together");
    }
    return true;
  }),
  validate,
];

// Shared household/log id validation for appliance-hour fetch and delete endpoints.
const applianceUsageLogIdRule = [
  param("householdId")
    .notEmpty().withMessage("householdId param is required")
    .isMongoId().withMessage("householdId must be a valid Mongo ID"),
  param("logId").isMongoId().withMessage("Invalid appliance usage log ID"),
  validate,
];

export {
  validate,
  createUsageRules,
  updateUsageRules,
  idParamRule,
  monthlyQueryRules,
  weatherImpactRules,
  applianceUsageLogCreateRules,
  applianceUsageLogUpdateRules,
  applianceUsageLogListRules,
  applianceUsageLogIdRule,
};
